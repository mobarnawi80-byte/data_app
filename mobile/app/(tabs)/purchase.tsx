import { useLocalSearchParams, useRouter } from 'expo-router';
import { PurchaseScreen } from '../../src/screens/PurchaseScreen';

export default function PurchaseRoute() {
  const { service } = useLocalSearchParams<{ service: 'DATA' | 'AIRTIME' }>();
  const router = useRouter();

  return (
    <PurchaseScreen
      serviceType={service ?? 'DATA'}
      onBack={() => router.back()}
    />
  );
}
