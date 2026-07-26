import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { NetworkSelector, NetworkType } from '../components/NetworkSelector';
import { CategorySelector, CategoryType } from '../components/CategorySelector';
import { PinKeypadModal } from '../components/PinKeypadModal';
import { detectNetworkFromPhone } from '../utils/networkDetector';

interface PurchaseScreenProps {
  onBack: () => void;
  serviceType: 'DATA' | 'AIRTIME';
}

interface PlanOption {
  id: string;
  name: string;
  price: number;
}

const SAMPLE_PLANS: Record<NetworkType, PlanOption[]> = {
  MTN: [
    { id: 'mtn_500mb', name: '500MB SME (30 Days)', price: 140 },
    { id: 'mtn_1gb', name: '1.0GB SME (30 Days)', price: 260 },
    { id: 'mtn_2gb', name: '2.0GB SME (30 Days)', price: 520 },
    { id: 'mtn_5gb', name: '5.0GB SME (30 Days)', price: 1300 },
    { id: 'mtn_10gb', name: '10.0GB SME (30 Days)', price: 2600 },
  ],
  AIRTEL: [
    { id: 'atl_1gb', name: '1.0GB CG (30 Days)', price: 280 },
    { id: 'atl_2gb', name: '2.0GB CG (30 Days)', price: 560 },
    { id: 'atl_5gb', name: '5.0GB CG (30 Days)', price: 1400 },
  ],
  GLO: [
    { id: 'glo_1gb', name: '1.0GB Direct (30 Days)', price: 300 },
    { id: 'glo_3gb', name: '3.0GB Direct (30 Days)', price: 850 },
  ],
  NINE_MOBILE: [
    { id: '9m_1gb', name: '1.0GB Direct (30 Days)', price: 250 },
    { id: '9m_2gb', name: '2.0GB Direct (30 Days)', price: 500 },
  ],
};

export const PurchaseScreen: React.FC<PurchaseScreenProps> = ({ onBack, serviceType }) => {
  const [network, setNetwork] = useState<NetworkType>('MTN');
  const [category, setCategory] = useState<CategoryType>('SME');
  const [phone, setPhone] = useState<string>('');
  const [airtimeAmount, setAirtimeAmount] = useState<string>('500');
  const [selectedPlan, setSelectedPlan] = useState<PlanOption>(SAMPLE_PLANS['MTN'][1]);
  const [isPinModalVisible, setIsPinModalVisible] = useState<boolean>(false);
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  const [detectedBadge, setDetectedBadge] = useState<string | null>(null);

  // Auto-detect network operator when user types phone number
  const handlePhoneChange = (input: string) => {
    setPhone(input);
    const autoNetwork = detectNetworkFromPhone(input);
    if (autoNetwork) {
      setNetwork(autoNetwork);
      setSelectedPlan(SAMPLE_PLANS[autoNetwork][0]);
      setDetectedBadge(`Auto-detected ${autoNetwork}`);
    } else {
      setDetectedBadge(null);
    }
  };

  // Open device contact picker using expo-contacts
  const handlePickContact = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
        });

        if (data.length > 0) {
          const contact = data[Math.floor(Math.random() * data.length)];
          if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
            const rawNumber = contact.phoneNumbers[0].number || '';
            handlePhoneChange(rawNumber);
          }
        } else {
          Alert.alert('Contacts', 'No contacts found on device.');
        }
      } else {
        Alert.alert('Permission Denied', 'Contacts permission is required to select contacts.');
      }
    } catch (err: any) {
      Alert.alert('Contact Error', err.message);
    }
  };

  const currentPlans = SAMPLE_PLANS[network] || [];
  const totalPrice = serviceType === 'DATA' ? selectedPlan.price : Number(airtimeAmount || 0);

  const handleProceedClick = () => {
    if (!phone || phone.length < 11) {
      Alert.alert('Invalid Phone', 'Please enter a valid 11-digit phone number.');
      return;
    }
    if (serviceType === 'AIRTIME' && Number(airtimeAmount) < 50) {
      Alert.alert('Invalid Amount', 'Minimum airtime amount is ₦50.');
      return;
    }
    setIsPinModalVisible(true);
  };

  const handleConfirmPinPurchase = async (pin: string) => {
    setIsPurchasing(true);
    setTimeout(() => {
      setIsPurchasing(false);
      setIsPinModalVisible(false);
      Alert.alert(
        '🎉 Transaction Successful!',
        `Successfully delivered ${serviceType === 'DATA' ? selectedPlan.name : `₦${airtimeAmount} Airtime`} to ${phone} via ${network}.`,
        [{ text: 'Great!', onPress: onBack }]
      );
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {serviceType === 'DATA' ? '📶 Purchase Data' : '📞 Recharge Airtime'}
          </Text>
        </View>

        {/* Network Selector */}
        <NetworkSelector
          selectedNetwork={network}
          onSelectNetwork={(net) => {
            setNetwork(net);
            if (SAMPLE_PLANS[net]) setSelectedPlan(SAMPLE_PLANS[net][0]);
          }}
        />

        {/* Category Selector (DATA only) */}
        {serviceType === 'DATA' && (
          <CategorySelector selectedCategory={category} onSelectCategory={setCategory} />
        )}

        {/* Phone Number Field with Contact Picker */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.inputLabel}>Recipient Phone Number</Text>
            {detectedBadge && <Text style={styles.detectedText}>{detectedBadge}</Text>}
          </View>

          <View style={styles.phoneInputWrapper}>
            <TextInput
              style={styles.phoneInput}
              value={phone}
              onChangeText={handlePhoneChange}
              placeholder="08012345678"
              placeholderTextColor="#64748B"
              keyboardType="phone-pad"
              maxLength={14}
            />

            <TouchableOpacity style={styles.contactBtn} onPress={handlePickContact}>
              <Text style={styles.contactBtnText}>📇 Contacts</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Data Plan Dropdown or Airtime Amount Input */}
        {serviceType === 'DATA' ? (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Select Data Bundle Plan</Text>
            <View style={styles.plansContainer}>
              {currentPlans.map((plan) => {
                const isSelected = selectedPlan.id === plan.id;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[styles.planCard, isSelected && styles.planCardActive]}
                    onPress={() => setSelectedPlan(plan)}
                  >
                    <View style={styles.planInfo}>
                      <Text style={[styles.planName, isSelected && styles.planNameActive]}>
                        {plan.name}
                      </Text>
                    </View>
                    <Text style={[styles.planPrice, isSelected && styles.planPriceActive]}>
                      ₦{plan.price}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Airtime Recharge Amount (₦)</Text>
            <TextInput
              style={styles.phoneInput}
              value={airtimeAmount}
              onChangeText={setAirtimeAmount}
              placeholder="500"
              placeholderTextColor="#64748B"
              keyboardType="number-pad"
            />
          </View>
        )}

        {/* Instant Price Preview Footer */}
        <View style={styles.previewBox}>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Total Amount Payable:</Text>
            <Text style={styles.previewPrice}>₦{totalPrice.toLocaleString('en-NG')}</Text>
          </View>

          <TouchableOpacity style={styles.proceedBtn} onPress={handleProceedClick}>
            <Text style={styles.proceedBtnText}>Proceed to Confirm 🔒</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 4-Digit Security PIN / Biometric Modal */}
      <PinKeypadModal
        visible={isPinModalVisible}
        title="Confirm Purchase"
        subtitle={`Confirm ₦${totalPrice} ${network} ${serviceType === 'DATA' ? selectedPlan.name : 'Airtime'} to ${phone}`}
        onClose={() => setIsPinModalVisible(false)}
        onConfirmPin={handleConfirmPinPurchase}
        isLoading={isPurchasing}
      />
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
  header: {
    marginBottom: 16,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  backText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
  },
  inputGroup: {
    marginVertical: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detectedText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 12,
  },
  phoneInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 16,
    paddingVertical: 14,
  },
  contactBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  contactBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  plansContainer: {
    gap: 8,
  },
  planCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  planCardActive: {
    borderColor: '#10B981',
    backgroundColor: '#10B98115',
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  planNameActive: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  planPrice: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '700',
  },
  planPriceActive: {
    color: '#10B981',
  },
  previewBox: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginTop: 20,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewLabel: {
    color: '#94A3B8',
    fontSize: 14,
  },
  previewPrice: {
    color: '#10B981',
    fontSize: 24,
    fontWeight: '800',
  },
  proceedBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  proceedBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
