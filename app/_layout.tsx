import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme } from '../hooks/use-color-scheme';
import { initContainer } from '../src/core/di/container';
import '@react-native-firebase/app';
import perf from '@react-native-firebase/perf';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function setup() {
      await initContainer();
      setIsReady(true);
    }
    setup();
  }, []);

  if (!isReady) {
    return null; // Or a splash screen
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} initialRouteName="login">
        <Stack.Screen name="login" />
        <Stack.Screen name="index" />
        <Stack.Screen name="main" />
        <Stack.Screen name="map" />
      </Stack>
    </ThemeProvider>
  );
}
