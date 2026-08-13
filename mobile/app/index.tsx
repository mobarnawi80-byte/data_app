import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useStore } from '../src/store/useStore';

export default function Index() {
  const { isAuthenticated, restoreSession } = useStore();
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    const restore = async () => {
      await restoreSession();
      setIsRestoring(false);
    };
    restore();
  }, []);

  // Show splash while restoring session
  if (isRestoring) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color="#6C63FF" size="large" />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? '/(tabs)/dashboard' : '/auth'} />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#090D16',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
