import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useStore } from './src/store/useStore';
import { AuthScreen } from './src/screens/AuthScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { PurchaseScreen } from './src/screens/PurchaseScreen';

export default function App() {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const [currentScreen, setCurrentScreen] = useState<'DASHBOARD' | 'PURCHASE'>('DASHBOARD');
  const [activeService, setActiveService] = useState<'DATA' | 'AIRTIME'>('DATA');

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <AuthScreen />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {currentScreen === 'DASHBOARD' ? (
        <DashboardScreen
          onNavigateToPurchase={(service) => {
            setActiveService(service);
            setCurrentScreen('PURCHASE');
          }}
        />
      ) : (
        <PurchaseScreen
          serviceType={activeService}
          onBack={() => setCurrentScreen('DASHBOARD')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
});
