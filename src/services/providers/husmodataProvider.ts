import { Network, Provider } from '@prisma/client';
import { IVtuProvider, ProviderPurchaseResponse, ProviderBalanceResponse } from './vtuProvider.interface';

export class HusmodataProvider implements IVtuProvider {
  readonly providerName: Provider = Provider.HUSMODATA;
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.HUSMODATA_BASE_URL || 'https://husmodataapi.com/api';
    this.apiKey = process.env.HUSMODATA_API_KEY || 'mock_husmodata_key';
  }

  /**
   * Network mapping for Husmodata API codes
   */
  private mapNetworkCode(network: Network): number {
    const networkMap: Record<Network, number> = {
      MTN: 1,
      GLO: 2,
      AIRTEL: 3,
      NINE_MOBILE: 4,
    };
    return networkMap[network] || 1;
  }

  async purchaseAirtime(network: Network, phone: string, amount: number): Promise<ProviderPurchaseResponse> {
    try {
      if (this.apiKey && this.apiKey !== 'mock_husmodata_key') {
        const response = await fetch(`${this.baseUrl}/topup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${this.apiKey}`,
          },
          body: JSON.stringify({
            network: this.mapNetworkCode(network),
            amount: amount,
            mobile_number: phone,
            Ported_number: true,
            airtime_type: 'VTU',
          }),
        });

        const data = await response.json();

        if (response.ok && (data.Status === 'successful' || data.status === 'success')) {
          return {
            success: true,
            status: 'SUCCESS',
            provider: this.providerName,
            provider_reference: data.ident || data.id,
            message: `Husmodata Airtime success: ₦${amount} to ${phone}`,
            raw_response: data,
          };
        } else if (data.Status === 'processing' || data.status === 'pending') {
          return {
            success: true,
            status: 'PENDING',
            provider: this.providerName,
            provider_reference: data.ident || data.id,
            message: 'Husmodata transaction in processing state.',
            raw_response: data,
          };
        } else {
          return {
            success: false,
            status: 'FAILED',
            provider: this.providerName,
            message: data.msg || data.error?.[0] || 'Husmodata Airtime purchase failed.',
            raw_response: data,
          };
        }
      }

      // Simulated environment logic
      const isFailedPhone = phone.endsWith('888'); // Simulates Husmodata failure if phone ends in 888

      if (!isFailedPhone) {
        return {
          success: true,
          status: 'SUCCESS',
          provider: this.providerName,
          provider_reference: `HUS-AIR-${Date.now()}`,
          message: `Successfully delivered ₦${amount} ${network} Airtime to ${phone} via Husmodata (Fallback Provider).`,
        };
      } else {
        return {
          success: false,
          status: 'FAILED',
          provider: this.providerName,
          message: 'Husmodata API error: Secondary network gateway down.',
        };
      }
    } catch (error: any) {
      console.error('[HusmodataProvider Error]:', error.message);
      return {
        success: false,
        status: 'FAILED',
        provider: this.providerName,
        message: error.message || 'Network exception communicating with Husmodata gateway.',
      };
    }
  }

  async purchaseData(network: Network, phone: string, planId: string): Promise<ProviderPurchaseResponse> {
    try {
      if (this.apiKey && this.apiKey !== 'mock_husmodata_key') {
        const response = await fetch(`${this.baseUrl}/data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${this.apiKey}`,
          },
          body: JSON.stringify({
            network: this.mapNetworkCode(network),
            mobile_number: phone,
            plan: planId,
            Ported_number: true,
          }),
        });

        const data = await response.json();

        if (response.ok && (data.Status === 'successful' || data.status === 'success')) {
          return {
            success: true,
            status: 'SUCCESS',
            provider: this.providerName,
            provider_reference: data.ident || data.id,
            message: `Husmodata Data success: plan ${planId} to ${phone}`,
            raw_response: data,
          };
        } else if (data.Status === 'processing' || data.status === 'pending') {
          return {
            success: true,
            status: 'PENDING',
            provider: this.providerName,
            provider_reference: data.ident || data.id,
            message: 'Husmodata Data transaction in processing state.',
            raw_response: data,
          };
        } else {
          return {
            success: false,
            status: 'FAILED',
            provider: this.providerName,
            message: data.msg || data.error?.[0] || 'Husmodata Data purchase failed.',
            raw_response: data,
          };
        }
      }

      // Simulated environment logic
      const isFailedPhone = phone.endsWith('888');

      if (!isFailedPhone) {
        return {
          success: true,
          status: 'SUCCESS',
          provider: this.providerName,
          provider_reference: `HUS-DATA-${Date.now()}`,
          message: `Successfully delivered ${network} Data plan (${planId}) to ${phone} via Husmodata (Fallback Provider).`,
        };
      } else {
        return {
          success: false,
          status: 'FAILED',
          provider: this.providerName,
          message: 'Husmodata API error: Secondary data portal balance low or plan unavailable.',
        };
      }
    } catch (error: any) {
      console.error('[HusmodataProvider Error]:', error.message);
      return {
        success: false,
        status: 'FAILED',
        provider: this.providerName,
        message: error.message || 'Network exception communicating with Husmodata gateway.',
      };
    }
  }

  async checkBalance(): Promise<ProviderBalanceResponse> {
    try {
      if (this.apiKey && this.apiKey !== 'mock_husmodata_key') {
        const response = await fetch(`${this.baseUrl}/user/`, {
          headers: { Authorization: `Token ${this.apiKey}` },
        });
        const data = await response.json();
        return {
          success: true,
          provider: this.providerName,
          balance: Number(data.user?.wallet_balance || 0),
          currency: 'NGN',
        };
      }

      return {
        success: true,
        provider: this.providerName,
        balance: 320000.00,
        currency: 'NGN',
      };
    } catch (error: any) {
      return {
        success: false,
        provider: this.providerName,
        balance: 0,
        currency: 'NGN',
        message: error.message,
      };
    }
  }
}
