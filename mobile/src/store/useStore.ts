import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  biometric_enabled: boolean;
}

export interface WalletData {
  balance: number;
  virtual_account_number: string;
  virtual_bank_name: string;
  virtual_account_name: string;
}

export interface DataPlan {
  id: string;
  network: 'MTN' | 'AIRTEL' | 'GLO' | 'NINE_MOBILE';
  category: 'SME' | 'CG' | 'DIRECT';
  name: string;
  size: string;
  validity: string;
  price: number;
}

interface AppState {
  user: UserProfile | null;
  wallet: WalletData | null;
  token: string | null;
  isBalanceVisible: boolean;
  isAuthenticated: boolean;
  selectedNetwork: 'MTN' | 'AIRTEL' | 'GLO' | 'NINE_MOBILE';
  selectedCategory: 'SME' | 'CG' | 'DIRECT';
  
  // Actions
  setUser: (user: UserProfile | null) => void;
  setWallet: (wallet: WalletData | null) => void;
  setToken: (token: string | null) => Promise<void>;
  toggleBalanceVisibility: () => void;
  setSelectedNetwork: (network: 'MTN' | 'AIRTEL' | 'GLO' | 'NINE_MOBILE') => void;
  setSelectedCategory: (category: 'SME' | 'CG' | 'DIRECT') => void;
  logout: () => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  user: {
    id: 'usr_881923',
    full_name: 'Amina Bello',
    email: 'amina.bello@example.ng',
    phone: '08031234567',
    biometric_enabled: true,
  },
  wallet: {
    balance: 48500.50,
    virtual_account_number: '8192039481',
    virtual_bank_name: 'Sterling Bank (Strowallet)',
    virtual_account_name: 'Amina Bello / VTU App',
  },
  token: null,
  isBalanceVisible: true,
  isAuthenticated: true,
  selectedNetwork: 'MTN',
  selectedCategory: 'SME',

  setUser: (user) => set({ user }),
  setWallet: (wallet) => set({ wallet }),
  
  setToken: async (token) => {
    if (token) {
      await SecureStore.setItemAsync('user_token', token);
    } else {
      await SecureStore.deleteItemAsync('user_token');
    }
    set({ token, isAuthenticated: !!token });
  },

  toggleBalanceVisibility: () =>
    set((state) => ({ isBalanceVisible: !state.isBalanceVisible })),

  setSelectedNetwork: (selectedNetwork) => set({ selectedNetwork }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),

  logout: async () => {
    await SecureStore.deleteItemAsync('user_token');
    set({ user: null, wallet: null, token: null, isAuthenticated: false });
  },
}));
