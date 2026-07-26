import React, { useState, useEffect } from 'react';

export interface DashboardStats {
  total_wallet_balance_sum: number;
  total_registered_users: number;
  daily_sales_volume: number;
  daily_sales_count: number;
  daily_estimated_profit: number;
  provider_mode: 'INLOMAX' | 'HUSMODATA' | 'AUTO_FAILOVER';
  providers_health: Array<{ provider: string; balance: number; currency: string; success: boolean }>;
}

export interface TransactionItem {
  id: string;
  reference: string;
  service_type: 'AIRTIME' | 'DATA';
  network: string;
  phone_number: string;
  amount: number;
  provider_used: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  created_at: string;
  user: { full_name: string; email: string };
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    total_wallet_balance_sum: 4850900.50,
    total_registered_users: 1240,
    daily_sales_volume: 382400.00,
    daily_sales_count: 412,
    daily_estimated_profit: 13384.00,
    provider_mode: 'AUTO_FAILOVER',
    providers_health: [
      { provider: 'INLOMAX', balance: 450000.00, currency: 'NGN', success: true },
      { provider: 'HUSMODATA', balance: 320000.00, currency: 'NGN', success: true },
    ],
  });

  const [providerMode, setProviderMode] = useState<'INLOMAX' | 'HUSMODATA' | 'AUTO_FAILOVER'>('AUTO_FAILOVER');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PRICING' | 'TRANSACTIONS' | 'USERS'>('OVERVIEW');

  // Modals state
  const [selectedTxForRefund, setSelectedTxForRefund] = useState<TransactionItem | null>(null);
  const [refundReason, setRefundReason] = useState<string>('');

  const sampleTransactions: TransactionItem[] = [
    {
      id: 'tx_1',
      reference: 'VTU-DATA-17219210-9123',
      service_type: 'DATA',
      network: 'MTN',
      phone_number: '08031234567',
      amount: 520,
      provider_used: 'INLOMAX',
      status: 'SUCCESS',
      created_at: '2026-07-26 14:45',
      user: { full_name: 'Amina Bello', email: 'amina@example.ng' },
    },
    {
      id: 'tx_2',
      reference: 'VTU-AIR-17219211-4411',
      service_type: 'AIRTIME',
      network: 'AIRTEL',
      phone_number: '08029998877',
      amount: 1000,
      provider_used: 'HUSMODATA',
      status: 'FAILED',
      created_at: '2026-07-26 14:20',
      user: { full_name: 'Emeka Okonkwo', email: 'emeka@example.ng' },
    },
    {
      id: 'tx_3',
      reference: 'VTU-DATA-17219212-7711',
      service_type: 'DATA',
      network: 'GLO',
      phone_number: '08051112233',
      amount: 850,
      provider_used: 'INLOMAX',
      status: 'PENDING',
      created_at: '2026-07-26 14:10',
      user: { full_name: 'Fatima Umar', email: 'fatima@example.ng' },
    },
  ];

  const handleProviderModeChange = (mode: 'INLOMAX' | 'HUSMODATA' | 'AUTO_FAILOVER') => {
    setProviderMode(mode);
    setStats((prev) => ({ ...prev, provider_mode: mode }));
    alert(`VTU Provider mode updated to ${mode}`);
  };

  const handleExecuteRefund = () => {
    if (!refundReason) {
      alert('Please enter a compulsory admin reason for this refund.');
      return;
    }
    alert(`Transaction ${selectedTxForRefund?.reference} refunded successfully. Reason: ${refundReason}`);
    setSelectedTxForRefund(null);
    setRefundReason('');
  };

  return (
    <div style={{ backgroundColor: '#090D16', minHeight: '100vh', color: '#F8FAFC', fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #1E293B' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#10B981' }}>🇳🇬 VTU Admin Control Center</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94A3B8' }}>System management, live API balances, pricing, and transaction monitor</p>
        </div>

        {/* Fallback Mode Switcher Pill */}
        <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: 12, padding: 4, display: 'flex', gap: 4 }}>
          {(['AUTO_FAILOVER', 'INLOMAX', 'HUSMODATA'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => handleProviderModeChange(mode)}
              style={{
                backgroundColor: providerMode === mode ? '#10B981' : 'transparent',
                color: providerMode === mode ? '#FFF' : '#94A3B8',
                border: 'none',
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {mode === 'AUTO_FAILOVER' ? '🔄 Auto Failover' : mode}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stat Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ backgroundColor: '#0F172A', borderRadius: 16, padding: 20, border: '1px solid #1E293B' }}>
          <span style={{ fontSize: 12, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Total User Wallet Sum</span>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#10B981', marginTop: 8 }}>₦{stats.total_wallet_balance_sum.toLocaleString()}</div>
          <span style={{ fontSize: 11, color: '#64748B' }}>{stats.total_registered_users} Registered Users</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', borderRadius: 16, padding: 20, border: '1px solid #1E293B' }}>
          <span style={{ fontSize: 12, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Daily Sales Volume</span>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#38BDF8', marginTop: 8 }}>₦{stats.daily_sales_volume.toLocaleString()}</div>
          <span style={{ fontSize: 11, color: '#64748B' }}>{stats.daily_sales_count} Successful Top-Ups Today</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', borderRadius: 16, padding: 20, border: '1px solid #1E293B' }}>
          <span style={{ fontSize: 12, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Est. Daily Profit</span>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#F59E0B', marginTop: 8 }}>₦{stats.daily_estimated_profit.toLocaleString()}</div>
          <span style={{ fontSize: 11, color: '#64748B' }}>3.5% Avg Markup Margin</span>
        </div>

        <div style={{ backgroundColor: '#0F172A', borderRadius: 16, padding: 20, border: '1px solid #1E293B' }}>
          <span style={{ fontSize: 12, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Live API Balances</span>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {stats.providers_health.map((p) => (
              <div key={p.provider} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#94A3B8', fontWeight: 600 }}>{p.provider}:</span>
                <span style={{ color: '#F8FAFC', fontWeight: 700 }}>₦{p.balance.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid #1E293B', marginBottom: 20, paddingBottom: 8 }}>
        {(['OVERVIEW', 'TRANSACTIONS', 'PRICING', 'USERS'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #10B981' : '2px solid transparent',
              color: activeTab === tab ? '#10B981' : '#94A3B8',
              padding: '8px 16px',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Transaction Monitor Section */}
      {(activeTab === 'OVERVIEW' || activeTab === 'TRANSACTIONS') && (
        <div style={{ backgroundColor: '#0F172A', borderRadius: 20, padding: 20, border: '1px solid #1E293B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>📊 Live Transaction Monitor</h2>

            <div style={{ display: 'flex', gap: 10 }}>
              {/* Search Filter */}
              <input
                type="text"
                placeholder="Search Phone or Ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: 10,
                  padding: '8px 12px',
                  color: '#F8FAFC',
                  fontSize: 13,
                }}
              />

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: 10,
                  padding: '8px 12px',
                  color: '#F8FAFC',
                  fontSize: 13,
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="PENDING">PENDING</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1E293B', color: '#94A3B8' }}>
                <th style={{ padding: 12 }}>Reference</th>
                <th style={{ padding: 12 }}>User</th>
                <th style={{ padding: 12 }}>Phone</th>
                <th style={{ padding: 12 }}>Service & Net</th>
                <th style={{ padding: 12 }}>Amount</th>
                <th style={{ padding: 12 }}>Provider</th>
                <th style={{ padding: 12 }}>Status</th>
                <th style={{ padding: 12 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sampleTransactions
                .filter((tx) => statusFilter === 'ALL' || tx.status === statusFilter)
                .map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid #1E293B' }}>
                    <td style={{ padding: 12, fontFamily: 'monospace', color: '#38BDF8' }}>{tx.reference}</td>
                    <td style={{ padding: 12 }}>
                      <div>{tx.user.full_name}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>{tx.user.email}</div>
                    </td>
                    <td style={{ padding: 12 }}>{tx.phone_number}</td>
                    <td style={{ padding: 12 }}>{tx.service_type} ({tx.network})</td>
                    <td style={{ padding: 12, fontWeight: 700 }}>₦{tx.amount}</td>
                    <td style={{ padding: 12, color: '#94A3B8' }}>{tx.provider_used}</td>
                    <td style={{ padding: 12 }}>
                      <span
                        style={{
                          backgroundColor:
                            tx.status === 'SUCCESS' ? '#10B98120' : tx.status === 'PENDING' ? '#F59E0B20' : '#F43F5E20',
                          color:
                            tx.status === 'SUCCESS' ? '#10B981' : tx.status === 'PENDING' ? '#F59E0B' : '#F43F5E',
                          padding: '4px 8px',
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: 11,
                        }}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      {tx.status !== 'FAILED' && (
                        <button
                          onClick={() => setSelectedTxForRefund(tx)}
                          style={{
                            backgroundColor: '#F43F5E20',
                            color: '#F43F5E',
                            border: '1px solid #F43F5E40',
                            padding: '6px 10px',
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Force Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Force Refund Modal */}
      {selectedTxForRefund && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: 20, padding: 24, width: 420 }}>
            <h3 style={{ margin: '0 0 8px', color: '#F43F5E' }}>⚠️ Force Refund Transaction</h3>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 16px' }}>
              Ref: <strong>{selectedTxForRefund.reference}</strong> (₦{selectedTxForRefund.amount})
            </p>

            <label style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 6 }}>
              Compulsory Admin Audit Reason:
            </label>
            <textarea
              rows={3}
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="State reason for manual refund..."
              style={{
                width: '100%',
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: 10,
                padding: 10,
                color: '#FFF',
                fontSize: 13,
                marginBottom: 16,
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setSelectedTxForRefund(null)}
                style={{ backgroundColor: '#1E293B', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteRefund}
                style={{ backgroundColor: '#F43F5E', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
              >
                Confirm Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
