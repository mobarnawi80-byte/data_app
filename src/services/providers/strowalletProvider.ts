import { Network, Provider } from '@prisma/client';
import { IVtuProvider, ProviderBalanceResponse, ProviderPurchaseResponse } from './vtuProvider.interface';

export interface StroWalletPlan {
  variation_code: string;
  name: string;
  amount: number;
  service_id: string;
  service_name: string;
  fixed_price?: boolean;
}

export interface StroWalletCustomer {
  customer_id: string;
  name?: string;
  address?: string;
  service_id?: string;
  raw_response?: Record<string, any>;
}

export class StrowalletProvider implements IVtuProvider {
  readonly providerName: Provider = Provider.STROWALLET;
  private readonly baseUrl: string;
  private readonly publicKey: string;

  constructor() {
    this.baseUrl = (process.env.STROWALLET_BASE_URL || 'https://strowallet.com/api').replace(/\/$/, '');
    this.publicKey = process.env.STROWALLET_PUBLIC_KEY || '';
  }

  private networkServiceId(network: Network): string {
    const services: Record<Network, string> = {
      MTN: 'mtn-data',
      AIRTEL: 'airtel-data',
      GLO: 'glo-data',
      NINE_MOBILE: 'etisalat-data',
    };
    return services[network];
  }

  private airtimeServiceName(network: Network): string {
    const services: Record<Network, string> = {
      MTN: 'mtn',
      AIRTEL: 'airtel',
      GLO: 'glo',
      NINE_MOBILE: 'etisalat',
    };
    return services[network];
  }

  private async request(path: string, options: RequestInit = {}, query: Record<string, string> = {}) {
    if (!this.publicKey) {
      throw new Error('STROWALLET_PUBLIC_KEY is not configured.');
    }

    const params = new URLSearchParams({ public_key: this.publicKey, ...query });
    const response = await fetch(`${this.baseUrl}${path}?${params.toString()}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || data.error || `StroWallet request failed with HTTP ${response.status}`);
    }

    return data as Record<string, any>;
  }

  private normalizePurchase(data: Record<string, any>, message: string): ProviderPurchaseResponse {
    const payload = data.data && typeof data.data === 'object' ? data.data : data;
    const statusValue = String(payload.status || data.status || payload.Status || data.Status || '').toLowerCase();
    const failed = data.success === false || ['failed', 'failure', 'error', 'reversed'].includes(statusValue);
    const pending = ['pending', 'processing', 'in progress'].includes(statusValue);
    const providerReference = payload.reference || payload.transaction_id || payload.trans_id || payload.ident || payload.id;

    return {
      success: !failed,
      status: failed ? 'FAILED' : pending ? 'PENDING' : 'SUCCESS',
      provider: this.providerName,
      provider_reference: providerReference ? String(providerReference) : undefined,
      message: data.message || payload.message || message,
      raw_response: data,
    };
  }

  async purchaseAirtime(network: Network, phone: string, amount: number): Promise<ProviderPurchaseResponse> {
    try {
      const data = await this.request('/buyairtime/request', {
        method: 'POST',
        body: JSON.stringify({
          amount: String(amount),
          phone,
          service_name: this.airtimeServiceName(network),
        }),
      });
      return this.normalizePurchase(data, `₦${amount} airtime delivered to ${phone}.`);
    } catch (error: any) {
      return {
        success: false,
        status: 'FAILED',
        provider: this.providerName,
        message: error.message || 'StroWallet airtime purchase failed.',
      };
    }
  }

  async purchaseData(network: Network, phone: string, planId: string, amount?: number): Promise<ProviderPurchaseResponse> {
    try {
      const data = await this.request('/buydata/request', {
        method: 'POST',
        body: JSON.stringify({
          amount: amount ? String(amount) : undefined,
          phone,
          service_id: this.networkServiceId(network),
          service_name: this.networkServiceId(network),
          variation_code: planId,
        }),
      });
      return this.normalizePurchase(data, `Data plan delivered to ${phone}.`);
    } catch (error: any) {
      return {
        success: false,
        status: 'FAILED',
        provider: this.providerName,
        message: error.message || 'StroWallet data purchase failed.',
      };
    }
  }

  async purchaseCable(request: {
    phone: string;
    amount: number;
    serviceId: string;
    variationCode: string;
    customerId: string;
    serviceName?: string;
  }): Promise<ProviderPurchaseResponse> {
    try {
      const data = await this.request('/cable-subscription/request', {
        method: 'POST',
        body: JSON.stringify({
          amount: String(request.amount),
          phone: request.phone,
          service_name: request.serviceName || request.variationCode,
          service_id: request.serviceId,
          variation_code: request.variationCode,
          customer_id: request.customerId,
        }),
      });
      return this.normalizePurchase(data, `Cable TV subscription completed for ${request.customerId}.`);
    } catch (error: any) {
      return {
        success: false,
        status: 'FAILED',
        provider: this.providerName,
        message: error.message || 'StroWallet cable TV subscription failed.',
      };
    }
  }

  async getDataPlans(network: Network): Promise<StroWalletPlan[]> {
    const data = await this.request('/buydata/plans', {}, { service_name: this.networkServiceId(network) });
    return this.normalizePlans(data, this.networkServiceId(network));
  }

  async getCableTvPlans(serviceId: string): Promise<StroWalletPlan[]> {
    const data = await this.request('/cable-subscription/plans', {}, { service_id: serviceId });
    return this.normalizePlans(data, serviceId);
  }

  async verifySmartCard(serviceId: string, customerId: string): Promise<StroWalletCustomer> {
    const data = await this.request(
      '/cable-subscription/verify-merchant',
      { method: 'POST' },
      { service_id: serviceId, customer_id: customerId },
    );
    const payload = data.data && typeof data.data === 'object' ? data.data : data;
    return {
      customer_id: customerId,
      name: payload.name || payload.customer_name || payload.customerName,
      address: payload.address,
      service_id: serviceId,
      raw_response: data,
    };
  }

  private normalizePlans(data: Record<string, any>, fallbackServiceId: string): StroWalletPlan[] {
    const payload = data.data && typeof data.data === 'object' ? data.data : data;
    const serviceId = payload.service_id || fallbackServiceId;
    const serviceName = payload.service_name || fallbackServiceId;
    const variations = payload.varations || payload.variations || payload.plans || [];

    return variations.map((plan: Record<string, any>) => ({
      variation_code: String(plan.variation_code || plan.code || plan.id),
      name: String(plan.name || plan.service_name || plan.description || plan.variation_code),
      amount: Number(plan.variation_amount || plan.amount || plan.price || 0),
      service_id: serviceId,
      service_name: serviceName,
      fixed_price: String(plan.fixedPrice || plan.fixed_price || '').toLowerCase() === 'yes',
    }));
  }

  async checkBalance(): Promise<ProviderBalanceResponse> {
    try {
      const data = await this.request('/wallet/balance/NGN');
      const payload = data.data && typeof data.data === 'object' ? data.data : data;
      return {
        success: data.success !== false,
        provider: this.providerName,
        balance: Number(payload.balance || payload.wallet_balance || payload.amount || 0),
        currency: 'NGN',
        message: data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        provider: this.providerName,
        balance: 0,
        currency: 'NGN',
        message: error.message || 'Unable to fetch StroWallet balance.',
      };
    }
  }
}
