import { Provider } from '@prisma/client';
import { IVTUProvider } from './vtuProvider.interface';
import { ProviderPurchaseRequest, ProviderPurchaseResponse } from '../../types/vtu';

export class HusmodataProvider implements IVTUProvider {
  readonly providerName: Provider = Provider.HUSMODATA;
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.HUSMODATA_BASE_URL || 'https://husmodataapi.com/api';
    this.apiKey = process.env.HUSMODATA_API_KEY || 'mock_key';
  }

  async purchaseAirtime(request: ProviderPurchaseRequest): Promise<ProviderPurchaseResponse> {
    try {
      // Production call: axios.post(`${this.baseUrl}/topup`, payload, { headers: { Authorization: `Token ${this.apiKey}` } })
      const mockSuccess = !request.phone_number.endsWith('888'); // Simulates failure if phone ends in 888

      if (mockSuccess) {
        return {
          success: true,
          provider: this.providerName,
          provider_reference: `HUS-AIR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          message: `Successfully recharged ₦${request.amount} ${request.network} airtime to ${request.phone_number} via Husmodata`,
        };
      } else {
        return {
          success: false,
          provider: this.providerName,
          message: 'Husmodata API error: Telecom network down.',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        provider: this.providerName,
        message: error.message || 'Unknown network error contacting Husmodata gateway',
      };
    }
  }

  async purchaseData(request: ProviderPurchaseRequest): Promise<ProviderPurchaseResponse> {
    try {
      const mockSuccess = !request.phone_number.endsWith('888');

      if (mockSuccess) {
        return {
          success: true,
          provider: this.providerName,
          provider_reference: `HUS-DATA-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          message: `Successfully delivered ${request.network} data plan (${request.plan_id}) to ${request.phone_number} via Husmodata`,
        };
      } else {
        return {
          success: false,
          provider: this.providerName,
          message: 'Husmodata API error: Invalid data plan ID or insufficient provider balance.',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        provider: this.providerName,
        message: error.message || 'Unknown network error contacting Husmodata gateway',
      };
    }
  }
}
