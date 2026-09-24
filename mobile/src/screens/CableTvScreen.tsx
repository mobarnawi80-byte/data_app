import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CablePlan, CableService, vtuApi } from '../services/api';
import { PinKeypadModal } from '../components/PinKeypadModal';
import { useStore } from '../store/useStore';

const SERVICES: Array<{ id: CableService; label: string }> = [
  { id: 'dstv', label: 'DStv' },
  { id: 'gotv', label: 'GOtv' },
  { id: 'startimes', label: 'StarTimes' },
  { id: 'showmax', label: 'Showmax' },
];

interface CableTvScreenProps {
  onBack: () => void;
}

export const CableTvScreen: React.FC<CableTvScreenProps> = ({ onBack }) => {
  const { user, token, wallet, fetchWallet } = useStore();
  const [service, setService] = useState<CableService>('dstv');
  const [customerId, setCustomerId] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [plans, setPlans] = useState<CablePlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<CablePlan | null>(null);
  const [customerName, setCustomerName] = useState<string>();
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [pinVisible, setPinVisible] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoadingPlans(true);
    vtuApi.getCablePlans(token, service).then((response) => {
      if (response.success && response.data) {
        setPlans(response.data);
        setSelectedPlan(response.data[0] || null);
      } else {
        setPlans([]);
        setSelectedPlan(null);
      }
      setLoadingPlans(false);
    });
  }, [service, token]);

  const verifyCustomer = async () => {
    if (!token || !customerId.trim()) {
      Alert.alert('Smartcard required', 'Enter a smartcard or customer number first.');
      return;
    }
    setVerifying(true);
    const response = await vtuApi.verifyCableCustomer(token, service, customerId.trim());
    setVerifying(false);
    if (response.success && response.data) {
      setCustomerName(response.data.name || 'Customer verified');
      Alert.alert('Customer verified', response.data.name || 'Smartcard verified successfully.');
    } else {
      setCustomerName(undefined);
      Alert.alert('Verification failed', response.error || response.message || 'Could not verify this smartcard.');
    }
  };

  const confirmPurchase = async (pin: string) => {
    if (!token || !user || !selectedPlan) return;
    if (Number(wallet?.balance || 0) < selectedPlan.amount) {
      setPinVisible(false);
      Alert.alert('Insufficient balance', 'Fund your wallet before completing this subscription.');
      return;
    }

    setPurchasing(true);
    const response = await vtuApi.purchase(token, {
      user_id: user.id,
      service_type: 'CABLE_TV',
      phone_number: phone.trim(),
      service_id: service,
      variation_code: selectedPlan.variation_code,
      customer_id: customerId.trim(),
      service_name: selectedPlan.name,
      amount: selectedPlan.amount,
      transaction_pin: pin,
    });
    setPurchasing(false);
    setPinVisible(false);

    if (response.success) {
      await fetchWallet();
      Alert.alert('Subscription submitted', response.data?.message || 'Your cable TV subscription was submitted.', [{ text: 'Done', onPress: onBack }]);
    } else {
      Alert.alert('Subscription failed', response.error || response.message || 'Could not complete the subscription.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Cable TV</Text>
        <Text style={styles.subtitle}>Choose a provider, verify the smartcard, then select a plan.</Text>

        <Text style={styles.label}>Provider</Text>
        <View style={styles.serviceRow}>
          {SERVICES.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.serviceButton, service === item.id && styles.serviceButtonActive]}
              onPress={() => { setService(item.id); setCustomerName(undefined); }}
            >
              <Text style={[styles.serviceText, service === item.id && styles.serviceTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Smartcard / Customer number</Text>
        <View style={styles.inlineInput}>
          <TextInput
            style={styles.inputInline}
            value={customerId}
            onChangeText={(value) => { setCustomerId(value); setCustomerName(undefined); }}
            placeholder="Enter smartcard number"
            placeholderTextColor="#64748B"
            keyboardType="number-pad"
          />
          <TouchableOpacity style={styles.verifyButton} onPress={verifyCustomer} disabled={verifying}>
            {verifying ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Verify</Text>}
          </TouchableOpacity>
        </View>
        {customerName && <Text style={styles.verified}>{customerName}</Text>}

        <Text style={styles.label}>Phone for notifications</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="08012345678"
          placeholderTextColor="#64748B"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Select plan</Text>
        {loadingPlans ? <ActivityIndicator color="#6C63FF" /> : plans.length === 0 ? (
          <Text style={styles.empty}>No plans available. Check your StroWallet configuration.</Text>
        ) : plans.map((plan) => (
          <TouchableOpacity
            key={plan.variation_code}
            style={[styles.plan, selectedPlan?.variation_code === plan.variation_code && styles.planActive]}
            onPress={() => setSelectedPlan(plan)}
          >
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planPrice}>N{plan.amount.toLocaleString('en-NG')}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.submit, (!selectedPlan || !customerId || !customerName || !phone) && styles.submitDisabled]}
          onPress={() => setPinVisible(true)}
          disabled={!selectedPlan || !customerId || !customerName || !phone}
        >
          <Text style={styles.submitText}>Continue to payment</Text>
        </TouchableOpacity>
      </ScrollView>
      <PinKeypadModal
        visible={pinVisible}
        title="Confirm cable subscription"
        subtitle={`Confirm N${selectedPlan?.amount || 0} ${selectedPlan?.name || ''} for ${customerId}`}
        onClose={() => setPinVisible(false)}
        onConfirmPin={confirmPurchase}
        isLoading={purchasing}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' },
  content: { padding: 20, paddingBottom: 40 },
  back: { color: '#10B981', fontWeight: '700', marginBottom: 16 },
  title: { color: '#FFFFFF', fontSize: 26, fontWeight: '800' },
  subtitle: { color: '#718096', marginTop: 6, marginBottom: 22 },
  label: { color: '#A0AEC0', fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 16 },
  serviceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  serviceButton: { borderWidth: 1, borderColor: '#1A2035', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  serviceButtonActive: { backgroundColor: '#1E1B4B', borderColor: '#6C63FF' },
  serviceText: { color: '#A0AEC0', fontWeight: '600' },
  serviceTextActive: { color: '#FFFFFF' },
  input: { backgroundColor: '#0D1221', borderWidth: 1, borderColor: '#1A2035', borderRadius: 12, padding: 15, color: '#FFFFFF', fontSize: 16 },
  inlineInput: { flexDirection: 'row', gap: 8 },
  inputInline: { flex: 1, backgroundColor: '#0D1221', borderWidth: 1, borderColor: '#1A2035', borderRadius: 12, padding: 15, color: '#FFFFFF', fontSize: 16 },
  verifyButton: { backgroundColor: '#2563EB', borderRadius: 12, justifyContent: 'center', paddingHorizontal: 16 },
  buttonText: { color: '#FFFFFF', fontWeight: '700' },
  verified: { color: '#22C55E', marginTop: 8, fontWeight: '600' },
  plan: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0D1221', borderWidth: 1, borderColor: '#1A2035', borderRadius: 12, padding: 15, marginBottom: 8 },
  planActive: { borderColor: '#6C63FF', backgroundColor: '#151538' },
  planName: { color: '#E2E8F0', flex: 1 },
  planPrice: { color: '#FFFFFF', fontWeight: '800' },
  empty: { color: '#F59E0B', paddingVertical: 15 },
  submit: { backgroundColor: '#6C63FF', borderRadius: 12, alignItems: 'center', padding: 17, marginTop: 24 },
  submitDisabled: { opacity: 0.45 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
