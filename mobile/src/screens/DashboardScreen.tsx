import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  RefreshControl,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useStore } from '../store/useStore';

interface DashboardScreenProps {
  onNavigateToPurchase: (service: 'DATA' | 'AIRTIME') => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigateToPurchase }) => {
  const { user, wallet, isBalanceVisible, toggleBalanceVisibility, fetchWallet, logout } = useStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWallet();
    setRefreshing(false);
  }, [fetchWallet]);

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleCopyAccount = async () => {
    if (wallet?.virtual_account_number) {
      await Clipboard.setStringAsync(wallet.virtual_account_number);
      Alert.alert('Copied!', `Account number ${wallet.virtual_account_number} copied to clipboard.`);
    }
  };

  const formatBalance = (bal?: number) => {
    if (bal === undefined || bal === null) return '₦0.00';
    return `₦${Number(bal).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" />
        }
      >
        {/* Greeting */}
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greeting}>
              Welcome, {user?.full_name?.split(' ')[0] ?? 'User'} 👋
            </Text>
            <Text style={styles.greetingSub}>Your VTU Dashboard</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Wallet Balance</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>
              {isBalanceVisible ? formatBalance(wallet?.balance) : '₦ ••••••'}
            </Text>
            <TouchableOpacity onPress={toggleBalanceVisibility}>
              <Text style={styles.eyeIcon}>{isBalanceVisible ? '👁️' : '🙈'}</Text>
            </TouchableOpacity>
          </View>

          {/* Virtual Account */}
          {wallet?.virtual_account_number && (
            <View style={styles.virtualAccount}>
              <Text style={styles.vaLabel}>Fund Your Wallet</Text>
              <Text style={styles.vaBankName}>
                {wallet.virtual_bank_name ?? 'Sterling Bank (Strowallet)'}
              </Text>
              <TouchableOpacity onPress={handleCopyAccount} style={styles.vaRow}>
                <Text style={styles.vaAccountNumber}>{wallet.virtual_account_number}</Text>
                <Text style={styles.vaCopy}>📋 Copy</Text>
              </TouchableOpacity>
              <Text style={styles.vaAccountName}>
                {wallet.virtual_account_name ?? user?.full_name}
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#1A1040' }]}
            onPress={() => onNavigateToPurchase('DATA')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIcon}>📶</Text>
            <Text style={styles.actionLabel}>Buy Data</Text>
            <Text style={styles.actionSub}>MTN, Airtel, GLO, 9Mobile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#0D2B1F' }]}
            onPress={() => onNavigateToPurchase('AIRTIME')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIcon}>📞</Text>
            <Text style={styles.actionLabel}>Buy Airtime</Text>
            <Text style={styles.actionSub}>All networks supported</Text>
          </TouchableOpacity>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>
            💡 Transfer money to your virtual account number above to fund your wallet automatically.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  greetingSub: { fontSize: 14, color: '#718096', marginTop: 2 },
  logoutBtn: {
    backgroundColor: '#1A0A0A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4A1010',
  },
  logoutText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },

  balanceCard: {
    backgroundColor: '#0D1221',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1A2035',
    marginBottom: 28,
  },
  balanceLabel: { fontSize: 13, color: '#718096', fontWeight: '500', marginBottom: 6 },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  balanceAmount: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1 },
  eyeIcon: { fontSize: 24 },

  virtualAccount: {
    backgroundColor: '#0A0F1A',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E2D4A',
  },
  vaLabel: { fontSize: 11, color: '#6C63FF', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  vaBankName: { fontSize: 13, color: '#A0AEC0', marginBottom: 6 },
  vaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  vaAccountNumber: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1.5 },
  vaCopy: { fontSize: 13, color: '#6C63FF', fontWeight: '600' },
  vaAccountName: { fontSize: 13, color: '#718096', marginTop: 4 },

  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', marginBottom: 14 },
  actionsGrid: { flexDirection: 'row', gap: 14, marginBottom: 24 },
  actionCard: {
    flex: 1,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1A2035',
  },
  actionIcon: { fontSize: 28, marginBottom: 10 },
  actionLabel: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  actionSub: { fontSize: 12, color: '#718096' },

  infoBanner: {
    backgroundColor: '#0A1628',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E2D4A',
  },
  infoText: { fontSize: 13, color: '#A0AEC0', lineHeight: 20 },
});
