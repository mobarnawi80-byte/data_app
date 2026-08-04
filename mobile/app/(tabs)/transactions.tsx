import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../src/store/useStore';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react-native';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: 'COMPLETED' | 'FAILED' | 'PENDING';
  description: string;
  createdAt: string;
}

const STATUS_COLORS = {
  COMPLETED: '#22C55E',
  FAILED: '#EF4444',
  PENDING: '#F59E0B',
};

const StatusIcon = ({ status }: { status: Transaction['status'] }) => {
  const size = 18;
  if (status === 'COMPLETED') return <CheckCircle color={STATUS_COLORS.COMPLETED} size={size} />;
  if (status === 'FAILED') return <XCircle color={STATUS_COLORS.FAILED} size={size} />;
  return <Clock color={STATUS_COLORS.PENDING} size={size} />;
};

export default function TransactionsScreen() {
  const { token } = useStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/api/wallets/transactions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) setTransactions(data.data || []);
    } catch (_err) {
      // silently fail — show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, []);

  const renderItem = ({ item }: { item: Transaction }) => (
    <View style={styles.txCard}>
      <View style={styles.txLeft}>
        <StatusIcon status={item.status} />
        <View style={styles.txInfo}>
          <Text style={styles.txDesc} numberOfLines={1}>{item.description}</Text>
          <Text style={styles.txDate}>
            {new Date(item.createdAt).toLocaleDateString('en-NG', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, { color: item.type === 'CREDIT' ? '#22C55E' : '#EF4444' }]}>
          {item.type === 'CREDIT' ? '+' : '-'}₦{item.amount.toLocaleString('en-NG')}
        </Text>
        <Text style={[styles.txStatus, { color: STATUS_COLORS[item.status] }]}>
          {item.status}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <TouchableOpacity onPress={() => { setRefreshing(true); fetchTransactions(); }}>
          <RefreshCw color="#6C63FF" size={20} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#6C63FF" size="large" style={{ marginTop: 60 }} />
      ) : transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Clock color="#2D3748" size={64} />
          <Text style={styles.emptyTitle}>No Transactions Yet</Text>
          <Text style={styles.emptySubtitle}>Your transaction history will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchTransactions(); }}
              tintColor="#6C63FF"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2035',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  listContent: { padding: 16, gap: 12 },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0D1221',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1A2035',
  },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 14, fontWeight: '600', color: '#E2E8F0', marginBottom: 3 },
  txDate: { fontSize: 11, color: '#4A5568' },
  txRight: { alignItems: 'flex-end', gap: 3 },
  txAmount: { fontSize: 15, fontWeight: '700' },
  txStatus: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#4A5568' },
  emptySubtitle: { fontSize: 14, color: '#2D3748', textAlign: 'center' },
});
