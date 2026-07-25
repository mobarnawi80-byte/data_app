import { Provider } from '@prisma/client';
import { ProviderPurchaseRequest, ProviderPurchaseResponse } from '../../types/vtu';

export interface IVTUProvider {
  readonly providerName: Provider;

  /**
   * Purchase Airtime from VTU provider
   */
  purchaseAirtime(request: ProviderPurchaseRequest): Promise<ProviderPurchaseResponse>;

  /**
   * Purchase Data Plan from VTU provider
   */
  purchaseData(request: ProviderPurchaseRequest): Promise<ProviderPurchaseResponse>;
}
