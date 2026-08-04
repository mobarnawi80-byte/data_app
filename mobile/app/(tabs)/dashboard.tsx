import { useRouter } from 'expo-router';
import { DashboardScreen } from '../../src/screens/DashboardScreen';

export default function DashboardRoute() {
  const router = useRouter();

  return (
    <DashboardScreen
      onNavigateToPurchase={(service) => {
        router.push({ pathname: '/(tabs)/purchase', params: { service } });
      }}
    />
  );
}
