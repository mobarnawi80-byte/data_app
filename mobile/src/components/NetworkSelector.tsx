import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export type NetworkType = 'MTN' | 'AIRTEL' | 'GLO' | 'NINE_MOBILE';

interface NetworkSelectorProps {
  selectedNetwork: NetworkType;
  onSelectNetwork: (network: NetworkType) => void;
}

const NETWORKS: Array<{ id: NetworkType; label: string; color: string; badge: string }> = [
  { id: 'MTN', label: 'MTN', color: '#FFCC00', badge: 'MTN' },
  { id: 'AIRTEL', label: 'Airtel', color: '#E60000', badge: 'ATL' },
  { id: 'GLO', label: 'Glo', color: '#008751', badge: 'GLO' },
  { id: 'NINE_MOBILE', label: '9Mobile', color: '#005A36', badge: '9MOB' },
];

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({
  selectedNetwork,
  onSelectNetwork,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Select Network Operator</Text>
      <View style={styles.grid}>
        {NETWORKS.map((net) => {
          const isSelected = selectedNetwork === net.id;
          return (
            <TouchableOpacity
              key={net.id}
              style={[
                styles.card,
                isSelected && { borderColor: net.color, backgroundColor: `${net.color}15` },
              ]}
              onPress={() => onSelectNetwork(net.id)}
            >
              <View style={[styles.badgeCircle, { backgroundColor: net.color }]}>
                <Text style={styles.badgeText}>{net.badge}</Text>
              </View>
              <Text style={[styles.networkLabel, isSelected && { color: '#F8FAFC' }]}>
                {net.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  sectionLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  card: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  badgeCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },
  networkLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
});
