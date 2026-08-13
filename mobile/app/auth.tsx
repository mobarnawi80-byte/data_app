import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { AuthScreen } from '../src/screens/AuthScreen';
import { useStore } from '../src/store/useStore';

export default function AuthRoute() {
  const router = useRouter();
  const isAuthenticated = useStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)/dashboard');
    }
  }, [isAuthenticated]);

  return <AuthScreen />;
}
