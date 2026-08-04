import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/useStore';
import {
  User,
  LogOut,
  Shield,
  Bell,
  HelpCircle,
  ChevronRight,
  Phone,
  Mail,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout } = useStore();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/auth');
        },
      },
    ]);
  };

  const menuItems = [
    { icon: Shield, label: 'Security & PIN', onPress: () => {} },
    { icon: Bell, label: 'Notifications', onPress: () => {} },
    { icon: HelpCircle, label: 'Help & Support', onPress: () => {} },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <User color="#6C63FF" size={40} />
          </View>
          <Text style={styles.userName}>{user?.name ?? 'VTU User'}</Text>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ Verified Account</Text>
          </View>
        </View>

        {/* Info Cards */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Mail color="#6C63FF" size={18} />
            <View>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email ?? 'user@example.com'}</Text>
            </View>
          </View>
          <View style={styles.infoCard}>
            <Phone color="#6C63FF" size={18} />
            <View>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{user?.phone ?? '08012345678'}</Text>
            </View>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          {menuItems.map(({ icon: Icon, label, onPress }) => (
            <TouchableOpacity key={label} style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIconWrap}>
                  <Icon color="#6C63FF" size={18} />
                </View>
                <Text style={styles.menuLabel}>{label}</Text>
              </View>
              <ChevronRight color="#4A5568" size={18} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut color="#EF4444" size={18} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>VTU App v1.0.0 · SDK 54</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2035',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  avatarSection: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#1A2035',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#6C63FF',
  },
  userName: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  verifiedBadge: {
    backgroundColor: '#0D2B1F',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  verifiedText: { color: '#22C55E', fontSize: 12, fontWeight: '600' },
  infoSection: { paddingHorizontal: 20, gap: 10, marginBottom: 24 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#0D1221',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1A2035',
  },
  infoLabel: { fontSize: 11, color: '#4A5568', fontWeight: '500' },
  infoValue: { fontSize: 14, color: '#E2E8F0', fontWeight: '600', marginTop: 2 },
  menuSection: { paddingHorizontal: 20, gap: 8, marginBottom: 24 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0D1221',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1A2035',
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1A1F3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { fontSize: 15, color: '#E2E8F0', fontWeight: '500' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: '#1A0A0A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#4A1010',
    marginBottom: 16,
  },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: '700' },
  version: { textAlign: 'center', color: '#2D3748', fontSize: 12, paddingBottom: 24 },
});
