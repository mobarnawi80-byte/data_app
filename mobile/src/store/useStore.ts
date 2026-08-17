import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi, walletApi, type AuthUser, type WalletBalance } from '../services/api';

export interface WalletData {
  balance: number;
  currency: string;
  virtual_account_number?: string;
  virtual_bank_name?: string;
  virtual_account_name?: string;
}

interface AppState {
  // Auth
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;

  // Wallet
  wallet: WalletData | null;
  isBalanceVisible: boolean;

  // UI Preferences
  selectedNetwork: 'MTN' | 'AIRTEL' | 'GLO' | 'NINE_MOBILE';
  selectedCategory: 'SME' | 'CG' | 'DIRECT';
  isLoading: boolean;
  error: string | null;

  // Actions — Auth
  login: (email: string, password: string) => Promise<boolean>;
  register: (payload: {
    full_name: string;
    email: string;
    phone: string;
    password: string;
    transaction_pin: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;

  // Actions — Wallet
  fetchWallet: () => Promise<void>;
  topUpWallet: (amount: number) => Promise<boolean>;
  toggleBalanceVisibility: () => void;

  // Actions — UI
  setSelectedNetwork: (network: 'MTN' | 'AIRTEL' | 'GLO' | 'NINE_MOBILE') => void;
  setSelectedCategory: (category: 'SME' | 'CG' | 'DIRECT') => void;
  clearError: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  wallet: null,
  isBalanceVisible: true,
  selectedNetwork: 'MTN',
  selectedCategory: 'SME',
  isLoading: false,
  error: null,

  // ─── Login ────────────────────────────────────────────────────────────────
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    const res = await authApi.login(email, password);
    if (!res.success || !res.data) {
      set({ isLoading: false, error: res.error ?? res.message ?? 'Login failed.' });
      return false;
    }
    const { token, user } = res.data;
    await SecureStore.setItemAsync('user_token', token);
    await SecureStore.setItemAsync('user_id', user.id);
    set({ token, user, isAuthenticated: true, isLoading: false });
    // Fetch wallet right after login
    get().fetchWallet();
    return true;
  },

  // ─── Register ─────────────────────────────────────────────────────────────
  register: async (payload) => {
    set({ isLoading: true, error: null });
    const res = await authApi.register(payload);
    if (!res.success || !res.data) {
      set({ isLoading: false, error: res.error ?? res.message ?? 'Registration failed.' });
      return false;
    }
    // After register, auto-login
    return get().login(payload.email, payload.password);
  },

  // ─── Restore session on app start ─────────────────────────────────────────
  restoreSession: async () => {
    try {
      const token = await SecureStore.getItemAsync('user_token');
      const userId = await SecureStore.getItemAsync('user_id');
      if (!token || !userId) return;

      // Verify token is still valid by fetching profile
      const res = await authApi.getProfile(token, userId);
      if (res.success && res.data) {
        set({ token, user: res.data, isAuthenticated: true });
        get().fetchWallet();
      } else {
        // Token expired — clear storage
        await SecureStore.deleteItemAsync('user_token');
        await SecureStore.deleteItemAsync('user_id');
      }
    } catch {
      // Silent fail — user will see login screen
    }
  },

  // ─── Logout ───────────────────────────────────────────────────────────────
  logout: async () => {
    await SecureStore.deleteItemAsync('user_token');
    await SecureStore.deleteItemAsync('user_id');
    set({ user: null, wallet: null, token: null, isAuthenticated: false });
  },

  // ─── Fetch Wallet ─────────────────────────────────────────────────────────
  fetchWallet: async () => {
    const { token, user } = get();
    if (!token || !user) return;
    const res = await walletApi.getBalance(token, user.id);
    if (res.success && res.data) {
      set({ wallet: res.data as WalletData });
    }
  },

  // ─── Top-Up Wallet (Demo / Test & Instant Funding) ─────────────────────────
  topUpWallet: async (amount) => {
    const { user } = get();
    if (!user) return false;
    set({ isLoading: true, error: null });
    const res = await walletApi.creditWallet(user.id, amount);
    if (res.success) {
      await get().fetchWallet();
      set({ isLoading: false });
      return true;
    }
    set({ isLoading: false, error: res.error ?? res.message ?? 'Top-up failed.' });
    return false;
  },

  toggleBalanceVisibility: () =>
    set((state) => ({ isBalanceVisible: !state.isBalanceVisible })),

  setSelectedNetwork: (selectedNetwork) => set({ selectedNetwork }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  clearError: () => set({ error: null }),
}));
