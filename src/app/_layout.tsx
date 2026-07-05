import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { getTestConfig } from '../services/config';
import { getLoggedInUser } from '../services/auth';
import { useStore } from '../store';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const user = useStore(state => state.user);
  const setUser = useStore(state => state.setUser);
  const segments = useSegments();
  const router = useRouter();
  const externalLinkState = useStore(state => state.externalLinkState);

  useEffect(() => {
    async function init() {
      // Initialize the test config right away so it's available
      const config = await getTestConfig();
      if (config.uiTestMode) {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        await AsyncStorage.removeItem('ytdash_auth_user');
      }
      // Load user
      const savedUser = await getLoggedInUser();
      setUser(savedUser);
      setIsReady(true);
    }
    init();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inMainGroup = segments[0] === '(main)';

    if (!user && !inAuthGroup) {
      // Redirect to the login page.
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Redirect to the home page.
      router.replace('/(main)/home');
    } else if (user && segments.length === 0) {
      router.replace('/(main)/home');
    }
  }, [user, segments, isReady]);

  if (!isReady) {
    return null; // Return a splash screen or loading indicator here
  }

  return (
    <>
      <Slot />
      {externalLinkState?.url && (
        <View style={styles.banner}>
          <Text testID="external_open_url">{externalLinkState.url}</Text>
        </View>
      )}
      {externalLinkState?.error && (
        <View style={styles.bannerError}>
          <Text testID="external_open_error">Failed to open external link</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'yellow',
    padding: 16,
    zIndex: 999,
  },
  bannerError: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'red',
    padding: 16,
    zIndex: 999,
  }
});
