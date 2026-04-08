import { Redirect } from 'expo-router';
import { useAuthStore } from '@/src/features/authentication/presentation/stores/auth-store';

export default function Index() {
  const { status } = useAuthStore();
  
  if (status === 'authenticated') {
    return <Redirect href="/main" />;
  }
  
  return <Redirect href="/login" />;
}
