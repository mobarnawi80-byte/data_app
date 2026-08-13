import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useStore } from '../store/useStore';

type AuthMode = 'LOGIN' | 'REGISTER';

export const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  const { login, register, restoreSession, isLoading, error, clearError } = useStore();

  useEffect(() => {
    checkBiometrics();
    restoreSession();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  }, [error]);

  const checkBiometrics = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setIsBiometricSupported(compatible && enrolled);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }
    await login(email.trim(), password);
  };

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !password.trim() || !pin.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      Alert.alert('Invalid PIN', 'Transaction PIN must be exactly 4 digits.');
      return;
    }
    await register({
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password: password,
      transaction_pin: pin,
    });
  };

  const handleBiometricLogin = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to login',
      disableDeviceFallback: false,
    });
    if (result.success) {
      // Biometric just verifies the device — try restoring session
      await restoreSession();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>⚡</Text>
            <Text style={styles.title}>VTU App</Text>
            <Text style={styles.subtitle}>
              {mode === 'LOGIN' ? 'Welcome back' : 'Create your account'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {mode === 'REGISTER' && (
              <>
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Amina Bello"
                    placeholderTextColor="#4A5568"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="08031234567"
                    placeholderTextColor="#4A5568"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </>
            )}

            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#4A5568"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#4A5568"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {mode === 'REGISTER' && (
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>4-Digit Transaction PIN</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0000"
                  placeholderTextColor="#4A5568"
                  value={pin}
                  onChangeText={setPin}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
              onPress={mode === 'LOGIN' ? handleLogin : handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitText}>
                  {mode === 'LOGIN' ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Biometric */}
            {mode === 'LOGIN' && isBiometricSupported && (
              <TouchableOpacity
                style={styles.biometricBtn}
                onPress={handleBiometricLogin}
                activeOpacity={0.7}
              >
                <Text style={styles.biometricText}>🔐 Use Fingerprint / Face ID</Text>
              </TouchableOpacity>
            )}

            {/* Toggle */}
            <TouchableOpacity
              style={styles.toggleBtn}
              onPress={() => {
                setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN');
                clearError();
              }}
            >
              <Text style={styles.toggleText}>
                {mode === 'LOGIN'
                  ? "Don't have an account? Sign Up"
                  : 'Already have an account? Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#718096', marginTop: 6 },
  form: { gap: 16 },
  inputWrap: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#A0AEC0', marginLeft: 4 },
  input: {
    backgroundColor: '#0D1221',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1A2035',
  },
  submitBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  biometricBtn: {
    borderWidth: 1,
    borderColor: '#1A2035',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  biometricText: { color: '#A0AEC0', fontSize: 15, fontWeight: '600' },
  toggleBtn: { alignItems: 'center', paddingVertical: 12 },
  toggleText: { color: '#6C63FF', fontSize: 14, fontWeight: '600' },
});
