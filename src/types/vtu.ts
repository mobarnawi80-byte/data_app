import { Network, ServiceType, Provider } from '@prisma/client';

export interface CreateUserDTO {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  transaction_pin: string;
  biometric_enabled?: boolean;
}

export interface CreditWalletDTO {
  user_id: string;
  amount: number;
  reference: string;
  description: string;
}

export interface DebitWalletDTO {
  user_id: string;
  amount: number;
  reference: string;
  description: string;
}

export interface PurchaseVTUDTO {
  user_id: string;
  service_type: ServiceType;
  network: Network;
  phone_number: string;
  plan_id?: string; // Required for DATA
  amount: number;
  transaction_pin: string;
  preferred_provider?: Provider;
}

export interface ProviderPurchaseRequest {
  reference: string;
  service_type: ServiceType;
  network: Network;
  phone_number: string;
  plan_id?: string;
  amount: number;
}

export interface ProviderPurchaseResponse {
  success: boolean;
  provider: Provider;
  provider_reference?: string;
  message?: string;
  raw_response?: Record<string, any>;
}
