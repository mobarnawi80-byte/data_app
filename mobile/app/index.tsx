import { Redirect } from 'expo-router';
import { useStore } from '../src/store/useStore';
import { View, ActivityIndicator } from 'react-native';

// Entry point — redirects based on auth state
export default function Index() {
  const isAuthenticated = useStore((state) => state.isAuthenticated);

  // Show brief loading state to allow store to hydrate
  if (isAuthenticated === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: '#090D16', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#6C63FF" />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? '/(tabs)/dashboard' : '/auth'} />;
}
