import { Network, Provider } from '@prisma/client';
import { IVtuProvider, ProviderPurchaseResponse, ProviderBalanceResponse } from './vtuProvider.interface';

export class InlomaxProvider implements IVtuProvider {
  readonly providerName: Provider = Provider.INLOMAX;
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.INLOMAX_BASE_URL || 'https://api.inlomax.com/v1';
    this.apiKey = process.env.INLOMAX_API_KEY || 'mock_inlomax_key';
  }

  /**
   * Network mapping for Inlomax REST API codes
   */
  private mapNetworkCode(network: Network): string {
    const networkMap: Record<Network, string> = {
      MTN: '01',
      GLO: '02',
      AIRTEL: '03',
      NINE_MOBILE: '04',
    };
    return networkMap[network] || '01';
  }

  async purchaseAirtime(network: Network, phone: string, amount: number): Promise<ProviderPurchaseResponse> {
    try {
      if (this.apiKey && this.apiKey !== 'mock_inlomax_key') {
        const response = await fetch(`${this.baseUrl}/airtime`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            network: this.mapNetworkCode(network),
            phone: phone,
            amount: amount,
            airtime_type: 'VTU',
          }),
        });

        const data = await response.json();

        if (response.ok && (data.status === 'success' || data.code === 200)) {
          return {
            success: true,
            status: 'SUCCESS',
            provider: this.providerName,
            provider_reference: data.reference || data.trans_id,
            message: `Inlomax Airtime success: ₦${amount} to ${phone}`,
            raw_response: data,
          };
        } else if (data.status === 'pending' || response.status === 202) {
          return {
            success: true,
            status: 'PENDING',
            provider: this.providerName,
            provider_reference: data.reference || data.trans_id,
            message: 'Inlomax transaction placed in PENDING state at telco switch.',
            raw_response: data,
          };
        } else {
          return {
            success: false,
            status: 'FAILED',
            provider: this.providerName,
            message: data.message || 'Inlomax Airtime purchase failed.',
            raw_response: data,
          };
        }
      }

      // Simulated environment logic
      const isFailedPhone = phone.endsWith('999');
      const isPendingPhone = phone.endsWith('777');

      if (isPendingPhone) {
        return {
          success: true,
          status: 'PENDING',
          provider: this.providerName,
          provider_reference: `INL-PEND-${Date.now()}`,
          message: 'Inlomax Airtime transaction in PENDING status.',
        };
      }

      if (!isFailedPhone) {
        return {
          success: true,
          status: 'SUCCESS',
          provider: this.providerName,
          provider_reference: `INL-AIR-${Date.now()}`,
          message: `Successfully delivered ₦${amount} ${network} Airtime to ${phone} via Inlomax.`,
        };
      } else {
        return {
          success: false,
          status: 'FAILED',
          provider: this.providerName,
          message: 'Inlomax API error: Operator gateway timeout on primary switch.',
        };
      }
    } catch (error: any) {
      console.error('[InlomaxProvider Error]:', error.message);
      return {
        success: false,
        status: 'FAILED',
        provider: this.providerName,
        message: error.message || 'Network exception communicating with Inlomax gateway.',
      };
    }
  }

  async purchaseData(network: Network, phone: string, planId: string): Promise<ProviderPurchaseResponse> {
    try {
      if (this.apiKey && this.apiKey !== 'mock_inlomax_key') {
        const response = await fetch(`${this.baseUrl}/data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            network: this.mapNetworkCode(network),
            phone: phone,
            plan: planId,
          }),
        });

        const data = await response.json();

        if (response.ok && (data.status === 'success' || data.code === 200)) {
          return {
            success: true,
            status: 'SUCCESS',
            provider: this.providerName,
            provider_reference: data.reference || data.trans_id,
            message: `Inlomax Data success: plan ${planId} to ${phone}`,
            raw_response: data,
          };
        } else if (data.status === 'pending' || response.status === 202) {
          return {
            success: true,
            status: 'PENDING',
            provider: this.providerName,
            provider_reference: data.reference || data.trans_id,
            message: 'Inlomax Data transaction in PENDING status.',
            raw_response: data,
          };
        } else {
          return {
            success: false,
            status: 'FAILED',
            provider: this.providerName,
            message: data.message || 'Inlomax Data purchase failed.',
            raw_response: data,
          };
        }
      }

      // Simulated environment logic
      const isFailedPhone = phone.endsWith('999');
      const isPendingPhone = phone.endsWith('777');

      if (isPendingPhone) {
        return {
          success: true,
          status: 'PENDING',
          provider: this.providerName,
          provider_reference: `INL-PEND-DATA-${Date.now()}`,
          message: 'Inlomax Data transaction in PENDING status.',
        };
      }

      if (!isFailedPhone) {
        return {
          success: true,
          status: 'SUCCESS',
          provider: this.providerName,
          provider_reference: `INL-DATA-${Date.now()}`,
          message: `Successfully delivered ${network} Data plan (${planId}) to ${phone} via Inlomax.`,
        };
      } else {
        return {
          success: false,
          status: 'FAILED',
          provider: this.providerName,
          message: 'Inlomax API error: Selected Data plan code unavailable.',
        };
      }
    } catch (error: any) {
      console.error('[InlomaxProvider Error]:', error.message);
      return {
        success: false,
        status: 'FAILED',
        provider: this.providerName,
        message: error.message || 'Network exception communicating with Inlomax gateway.',
      };
    }
  }

  async checkBalance(): Promise<ProviderBalanceResponse> {
    try {
      if (this.apiKey && this.apiKey !== 'mock_inlomax_key') {
        const response = await fetch(`${this.baseUrl}/user/balance`, {
          headers: { Authorization: `Bearer ${this.apiKey}` },
        });
        const data = await response.json();
        return {
          success: true,
          provider: this.providerName,
          balance: Number(data.balance || 0),
          currency: 'NGN',
        };
      }

      return {
        success: true,
        provider: this.providerName,
        balance: 450000.00,
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
