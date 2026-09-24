import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useStore } from './src/store/useStore';
import { AuthScreen } from './src/screens/AuthScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { PurchaseScreen } from './src/screens/PurchaseScreen';

import { CableTvScreen } from './src/screens/CableTvScreen';

export default function App() {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const [currentScreen, setCurrentScreen] = useState<'DASHBOARD' | 'PURCHASE' | 'CABLE_TV'>('DASHBOARD');
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
            if (service === 'CABLE_TV') {
              setCurrentScreen('CABLE_TV');
            } else {
              setActiveService(service);
              setCurrentScreen('PURCHASE');
            }
          }}
        />
      ) : currentScreen === 'CABLE_TV' ? (
        <CableTvScreen onBack={() => setCurrentScreen('DASHBOARD')} />
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
    backgroundColor: '#090b16',
  },
});
