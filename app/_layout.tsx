import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import TestConfigModule from '../modules/test-config';
import { useAppStore } from '../store';

export default function Layout() {
  const [configLoaded, setConfigLoaded] = useState(false);
  const setConfig = useAppStore((state) => state.setConfig);
  const capturedUrl = useAppStore((state) => state.capturedUrl);
  const externalOpenError = useAppStore((state) => state.externalOpenError);

  useEffect(() => {
    async function loadConfig() {
      try {
        const config = await TestConfigModule.getTestConfig();
        setConfig(config);
      } catch (e) {
        console.error('Failed to load test config', e);
        setConfig({ captureExternalLinks: false, uiTestMode: false });
      } finally {
        setConfigLoaded(true);
      }
    }
    loadConfig();
  }, []);

  if (!configLoaded) {
    return (
      <View style={styles.loading}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="home" />
        <Stack.Screen name="map" />
      </Stack>
      
      {capturedUrl && (
        <SafeAreaView style={styles.banner}>
          <Text testID="external_open_url" style={styles.bannerText}>{capturedUrl}</Text>
        </SafeAreaView>
      )}
      
      {externalOpenError && (
        <SafeAreaView style={styles.errorBanner}>
          <Text testID="external_open_error" style={styles.errorText}>{externalOpenError}</Text>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  banner: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'yellow', padding: 16 },
  bannerText: { color: 'black', fontWeight: 'bold' },
  errorBanner: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'red', padding: 16 },
  errorText: { color: 'white', fontWeight: 'bold' }
});
