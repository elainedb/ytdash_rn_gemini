import { useEffect } from 'react';
import { Redirect, router } from 'expo-router';
import { useAuthStore } from '../src/features/authentication/presentation/stores/auth-store';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
  const { status, checkAuthStatus } = useAuthStore();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/main');
    } else if (status === 'unauthenticated' || status === 'error') {
      router.replace('/login');
    }
  }, [status]);

  if (status === 'initial' || status === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  return <View />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
