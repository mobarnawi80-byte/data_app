import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useStore } from '../store/useStore';

interface DashboardScreenProps {
  onNavigateToPurchase: (service: 'DATA' | 'AIRTIME') => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigateToPurchase }) => {
  const { user, wallet, isBalanceVisible, toggleBalanceVisibility, logout } = useStore();

  const handleCopyAccount = async () => {
    if (wallet?.virtual_account_number) {
      await Clipboard.setStringAsync(wallet.virtual_account_number);
      Alert.alert('Copied!', `Account number ${wallet.virtual_account_number} copied to clipboard.`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top User Bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Good day 👋</Text>
            <Text style={styles.userName}>{user?.full_name || 'Valued Customer'}</Text>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Available Wallet Balance</Text>
            <TouchableOpacity onPress={toggleBalanceVisibility} style={styles.eyeBtn}>
              <Text style={styles.eyeIcon}>{isBalanceVisible ? '👁️' : '🙈'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.balanceAmount}>
            {isBalanceVisible
              ? `₦${(wallet?.balance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
              : '₦ • • • • • •'}
          </Text>

          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Active Strowallet NGN Account</Text>
          </View>
        </View>

        {/* Strowallet Virtual Account Info Box */}
        <View style={styles.accountCard}>
          <View style={styles.accountCardHeader}>
            <Text style={styles.accountCardTitle}>🏦 Automated Bank Funding Account</Text>
            <Text style={styles.providerTag}>Strowallet API</Text>
          </View>

          <Text style={styles.accountSubtext}>
            Transfer money to this dedicated account for instant automated wallet top-up.
          </Text>

          <View style={styles.accountDetailsGrid}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bank Name:</Text>
              <Text style={styles.detailValue}>{wallet?.virtual_bank_name || 'Sterling Bank'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Account Name:</Text>
              <Text style={styles.detailValue}>{wallet?.virtual_account_name || 'Amina Bello'}</Text>
            </View>

            <View style={[styles.detailRow, styles.accountNumRow]}>
              <View>
                <Text style={styles.detailLabel}>Account Number:</Text>
                <Text style={styles.accountNumValue}>
                  {wallet?.virtual_account_number || '8192039481'}
                </Text>
              </View>

              <TouchableOpacity style={styles.copyBtn} onPress={handleCopyAccount}>
                <Text style={styles.copyBtnText}>📋 Copy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionHeader}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#10B9811A', borderColor: '#10B98140' }]}
            onPress={() => onNavigateToPurchase('DATA')}
          >
            <Text style={styles.actionIcon}>📶</Text>
            <Text style={styles.actionTitle}>Buy Data</Text>
            <Text style={styles.actionSubtitle}>SME, CG & Direct</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#38BDF81A', borderColor: '#38BDF840' }]}
            onPress={() => onNavigateToPurchase('AIRTIME')}
          >
            <Text style={styles.actionIcon}>📞</Text>
            <Text style={styles.actionTitle}>Buy Airtime</Text>
            <Text style={styles.actionSubtitle}>Instant Top-Up</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#F59E0B1A', borderColor: '#F59E0B40' }]}
            onPress={() => Alert.alert('History', 'Opening full transaction history...')}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionTitle}>History</Text>
            <Text style={styles.actionSubtitle}>Ledger & Orders</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions Preview */}
        <View style={styles.recentHeader}>
          <Text style={styles.sectionHeader}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentList}>
          <View style={styles.recentItem}>
            <View style={[styles.txIconCircle, { backgroundColor: '#10B98120' }]}>
              <Text style={styles.txEmoji}>📶</Text>
            </View>
            <View style={styles.txInfo}>
              <Text style={styles.txTitle}>MTN SME 2.0GB Data</Text>
              <Text style={styles.txDate}>Today, 02:45 PM • 08031234567</Text>
            </View>
            <Text style={styles.txAmountDebit}>-₦520.00</Text>
          </View>

          <View style={styles.recentItem}>
            <View style={[styles.txIconCircle, { backgroundColor: '#0EA5E920' }]}>
              <Text style={styles.txEmoji}>🏦</Text>
            </View>
            <View style={styles.txInfo}>
              <Text style={styles.txTitle}>Strowallet Bank Deposit</Text>
              <Text style={styles.txDate}>Yesterday, 09:12 AM • Sterling Bank</Text>
            </View>
            <Text style={styles.txAmountCredit}>+₦10,000.00</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  scrollContent: {
    padding: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    color: '#94A3B8',
    fontSize: 13,
  },
  userName: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  logoutText: {
    color: '#F43F5E',
    fontSize: 12,
    fontWeight: '600',
  },
  balanceCard: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#10B98140',
    marginBottom: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  eyeBtn: {
    padding: 4,
  },
  eyeIcon: {
    fontSize: 16,
  },
  balanceAmount: {
    color: '#10B981',
    fontSize: 32,
    fontWeight: '800',
    marginVertical: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  accountCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 24,
  },
  accountCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  accountCardTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  providerTag: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: '#38BDF820',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  accountSubtext: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 12,
  },
  accountDetailsGrid: {
    backgroundColor: '#1E293B60',
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    color: '#94A3B8',
    fontSize: 12,
  },
  detailValue: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
  },
  accountNumRow: {
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  accountNumValue: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  copyBtn: {
    backgroundColor: '#10B98120',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  copyBtnText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  actionTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  actionSubtitle: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seeAllText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  recentList: {
    gap: 10,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  txIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txEmoji: {
    fontSize: 18,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  txDate: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  txAmountDebit: {
    color: '#F43F5E',
    fontSize: 14,
    fontWeight: '700',
  },
  txAmountCredit: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
  },
});
