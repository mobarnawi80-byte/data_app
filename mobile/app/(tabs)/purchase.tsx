import { useLocalSearchParams, useRouter } from 'expo-router';
import { PurchaseScreen } from '../../src/screens/PurchaseScreen';
import { CableTvScreen } from '../../src/screens/CableTvScreen';

export default function PurchaseRoute() {
  const { service } = useLocalSearchParams<{ service: 'DATA' | 'AIRTIME' | 'CABLE_TV' }>();
  const router = useRouter();

  if (service === 'CABLE_TV') {
    return <CableTvScreen onBack={() => router.back()} />;
  }

  return (
    <PurchaseScreen
      serviceType={service ?? 'DATA'}
      onBack={() => router.back()}
    />
  );
}
