/**
 * Central API service for the Sublyte mobile app.
 * All HTTP calls to the Node.js backend go through here.
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.40:3000';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  biometric_enabled: boolean;
  status: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  transaction_pin: string;
}

export interface WalletBalance {
  balance: number;
  currency: string;
  virtual_account_number?: string;
  virtual_bank_name?: string;
  virtual_account_name?: string;
}

export interface Transaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  status: 'COMPLETED' | 'FAILED' | 'PENDING';
  description: string;
  reference: string;
  createdAt: string;
}

export interface DataPlan {
  variation_code: string;
  name: string;
  amount: number;
  service_id: string;
  service_name: string;
  fixed_price?: boolean;
}

export type CableService = 'dstv' | 'gotv' | 'startimes' | 'showmax';

export interface CablePlan extends DataPlan {}

export interface CableCustomer {
  customer_id: string;
  name?: string;
  address?: string;
  service_id?: string;
}

export interface VtuPurchasePayload {
  user_id: string;
  network?: 'MTN' | 'AIRTEL' | 'GLO' | 'NINE_MOBILE';
  phone_number: string;
  plan_id?: string;
  service_id?: string;
  variation_code?: string;
  customer_id?: string;
  service_name?: string;
  amount: number;
  service_type: 'DATA' | 'AIRTIME' | 'CABLE_TV';
  category?: 'SME' | 'CG' | 'DIRECT';
  transaction_pin: string;
}

// ─── Core fetch helper ─────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });

    const json = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: json?.message ?? json?.error ?? `HTTP ${response.status}`,
      };
    }

    return json;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error';
    return {
      success: false,
      error: `Cannot reach server. Make sure you're on the same Wi-Fi network. (${message})`,
    };
  }
}

// ─── Auth API ──────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: RegisterPayload) =>
    request<LoginResponse>('/api/users/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getProfile: (token: string, userId: string) =>
    request<AuthUser>(`/api/users/${userId}`, {}, token),
};

// ─── Wallet API ────────────────────────────────────────────────────────────────

export const walletApi = {
  getBalance: (token: string, userId: string) =>
    request<WalletBalance>(`/api/wallets/${userId}`, {}, token),

  getTransactions: (token: string, userId: string, page = 1, limit = 20) =>
    request<{ transactions: Transaction[]; total: number }>(
      `/api/wallets/${userId}/ledger?page=${page}&limit=${limit}`,
      {},
      token
    ),

  creditWallet: (userId: string, amount: number, reference?: string, description?: string) =>
    request<WalletBalance>('/api/wallets/credit', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        amount,
        reference: reference || `TOPUP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        description: description || 'Instant Wallet Top-Up',
      }),
    }),
};

// ─── VTU API ───────────────────────────────────────────────────────────────────

export const vtuApi = {
  getDataPlans: (token: string, network: string, category?: string) => {
    const params = new URLSearchParams({ network });
    if (category) params.append('category', category);
    return request<DataPlan[]>(`/api/vtu/plans?${params}`, {}, token);
  },

  getCablePlans: (token: string, serviceId: CableService) =>
    request<CablePlan[]>(`/api/vtu/cable/plans?service_id=${serviceId}`, {}, token),

  verifyCableCustomer: (token: string, serviceId: CableService, customerId: string) =>
    request<CableCustomer>('/api/vtu/cable/verify', {
      method: 'POST',
      body: JSON.stringify({ service_id: serviceId, customer_id: customerId }),
    }, token),

  purchase: (token: string, payload: VtuPurchasePayload) =>
    request<{ transaction_id: string; reference: string; message: string }>(
      '/api/vtu/purchase',
      { method: 'POST', body: JSON.stringify(payload) },
      token
    ),
};

// ─── Health check ──────────────────────────────────────────────────────────────

export const healthCheck = () =>
  request<{ status: string }>('/health');
