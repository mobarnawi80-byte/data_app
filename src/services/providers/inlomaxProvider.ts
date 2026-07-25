import { Provider } from '@prisma/client';
import { IVTUProvider } from './vtuProvider.interface';
import { ProviderPurchaseRequest, ProviderPurchaseResponse } from '../../types/vtu';

export class InlomaxProvider implements IVTUProvider {
  readonly providerName: Provider = Provider.INLOMAX;
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.INLOMAX_BASE_URL || 'https://api.inlomax.com/v1';
    this.apiKey = process.env.INLOMAX_API_KEY || 'mock_key';
  }

  async purchaseAirtime(request: ProviderPurchaseRequest): Promise<ProviderPurchaseResponse> {
    try {
      // In production, this performs a POST request to Inlomax Airtime API endpoint:
      // axios.post(`${this.baseUrl}/airtime`, payload, { headers: { Authorization: `Bearer ${this.apiKey}` } })
      
      // Simulated provider response logic for demonstration & unit testing:
      const mockSuccess = !request.phone_number.endsWith('999'); // Simulates failure if phone ends in 999

      if (mockSuccess) {
        return {
          success: true,
          provider: this.providerName,
          provider_reference: `INL-AIR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          message: `Successfully recharged ₦${request.amount} ${request.network} airtime to ${request.phone_number} via Inlomax`,
        };
      } else {
        return {
          success: false,
          provider: this.providerName,
          message: 'Inlomax API error: Network gateway timeout on telecom operator switch.',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        provider: this.providerName,
        message: error.message || 'Unknown network error contacting Inlomax gateway',
      };
    }
  }

  async purchaseData(request: ProviderPurchaseRequest): Promise<ProviderPurchaseResponse> {
    try {
      const mockSuccess = !request.phone_number.endsWith('999');

      if (mockSuccess) {
        return {
          success: true,
          provider: this.providerName,
          provider_reference: `INL-DATA-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          message: `Successfully delivered ${request.network} data plan (${request.plan_id}) to ${request.phone_number} via Inlomax`,
        };
      } else {
        return {
          success: false,
          provider: this.providerName,
          message: 'Inlomax API error: Selected data plan unavailable on provider portal.',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        provider: this.providerName,
        message: error.message || 'Unknown network error contacting Inlomax gateway',
      };
    }
  }
}
