import { Network, Provider } from '@prisma/client';

export type ProviderTxStatus = 'SUCCESS' | 'PENDING' | 'FAILED';

export interface ProviderPurchaseResponse {
  success: boolean;
  status: ProviderTxStatus;
  provider: Provider;
  provider_reference?: string;
  message?: string;
  raw_response?: Record<string, any>;
}

export interface ProviderBalanceResponse {
  success: boolean;
  provider: Provider;
  balance: number;
  currency: string;
  message?: string;
}

export interface IVtuProvider {
  readonly providerName: Provider;

  /**
   * Purchase Airtime from VTU provider
   */
  purchaseAirtime(network: Network, phone: string, amount: number): Promise<ProviderPurchaseResponse>;

  /**
   * Purchase Data Plan from VTU provider
   */
  purchaseData(network: Network, phone: string, planId: string): Promise<ProviderPurchaseResponse>;

  /**
   * Check Provider API Wallet/Float Balance
   */
  checkBalance(): Promise<ProviderBalanceResponse>;
}
