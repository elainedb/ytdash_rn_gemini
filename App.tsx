import React from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { VideoStateProvider, useVideoState } from './src/hooks/useVideoState';
import { LoginScreen } from './src/components/LoginScreen';
import { HomeScreen } from './src/components/HomeScreen';
import { MapViewComponent } from './src/components/MapView';
import { DetailSheet } from './src/components/DetailSheet';
import { ExternalOpenBanner } from './src/components/ExternalOpenBanner';

function AppContent() {
  const { isLoggedIn, currentScreen, setCurrentScreen } = useVideoState();

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <LoginScreen />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Primary Screen Views */}
      {currentScreen === 'home' && <HomeScreen />}
      {currentScreen === 'map' && <MapViewComponent />}

      {/* Floating back button overlay on the Map View to return to List view */}
      {currentScreen === 'map' && (
        <Pressable
          testID="map_nav_button"
          style={styles.mapFab}
          onPress={() => setCurrentScreen('home')}
        >
          <Text style={styles.mapFabIcon}>📋</Text>
          <Text style={styles.mapFabText}>View List</Text>
        </Pressable>
      )}

      {/* Global Overlays */}
      <DetailSheet />
      <ExternalOpenBanner />

      <StatusBar style="light" />
    </View>
  );
}

export default function App() {
  return (
    <VideoStateProvider>
      <AppContent />
    </VideoStateProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Slate 900 matches our design system
  },
  mapFab: {
    position: 'absolute',
    bottom: 120, // Sit above the native marker chips row (which sits at bottom: 24 with height: 44 + padding)
    right: 20,
    backgroundColor: '#6366F1', // Indigo 500
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    gap: 8,
    zIndex: 999, // Ensure it floats on top of the webview
  },
  mapFabIcon: {
    fontSize: 16,
  },
  mapFabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
