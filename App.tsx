import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Pressable,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { Video, ScreenType } from './src/types';
import { getTestConfig, TestConfig } from './src/utils/TestConfig';
import { fetchAllVideos } from './src/services/api';
import { loadCachedVideos, saveVideosToCache, clearCache } from './src/services/cache';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';

export default function App() {
  const [testConfig, setTestConfig] = useState<TestConfig | null>(null);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('login');
  
  // App Domain State
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // External open states
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);

  // Initialize Configuration & Real Google Sign-In
  useEffect(() => {
    async function initApp() {
      try {
        const config = await getTestConfig();
        setTestConfig(config);

        // Safely initialize real Google Sign-In if not in uiTestMode or for real production use
        if (!config.uiTestMode) {
          GoogleSignin.configure({
            scopes: ['email', 'profile'],
            webClientId: '659223708605-tgeipqg4t1j1oagb82p164hld6200vda.apps.googleusercontent.com', // standard client ID placeholder if google-services.json not loaded
          });
        }
      } catch (err) {
        console.warn('Failed to initialize Google Sign-In:', err);
      }
    }
    initApp();
  }, []);

  // Fetch feeds from API (with local cache fallback)
  const loadFeeds = async (forceRefresh = false) => {
    if (!testConfig) return;

    setStatus('loading');
    setErrorMessage(null);

    // 1. Try to load from disk cache first
    let cached: Video[] = [];
    try {
      cached = await loadCachedVideos();
      if (cached.length > 0 && !forceRefresh) {
        setVideos(cached);
        setStatus('success'); // Immediately show cached content
      }
    } catch (e) {
      console.warn('Error loading cached videos on start:', e);
    }

    // 2. Fetch fresh from API
    try {
      // Base URL priority: 1. Launch Intent 2. Real Google URL
      const apiBaseUrl = testConfig.apiBaseUrl || 'https://www.googleapis.com';
      const apiKey = testConfig.apiKey || 'AIzaSyCtXDxtAawyJ54pZPnH6cmm10QPxRfZoo8';

      console.log(`Fetching from API: ${apiBaseUrl}`);
      const freshVideos = await fetchAllVideos({ apiBaseUrl, apiKey });

      setVideos(freshVideos);
      await saveVideosToCache(freshVideos);
      setStatus('success');
    } catch (err: any) {
      console.error('API fetch failed:', err);
      
      // If we have cached videos, fallback to them offline-first! (AC-CACHE-01)
      if (cached.length > 0) {
        setVideos(cached);
        setStatus('success'); // Keep success status so no blocking error screen appears
      } else {
        setErrorMessage(err.message || 'Failed to fetch feeds.');
        setStatus('error');
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadFeeds(true);
    setIsRefreshing(false);
  };

  const handleLoginSuccess = async (email: string) => {
    setUserEmail(email);
    setCurrentScreen('home');
    // Once signed in, kick off the aggregator
    setTimeout(() => {
      loadFeeds();
    }, 100);
  };

  const handleLogout = async () => {
    try {
      if (testConfig && !testConfig.uiTestMode) {
        await GoogleSignin.signOut();
      }
    } catch (err) {
      console.warn('Error signing out:', err);
    }
    setUserEmail(null);
    setVideos([]);
    await clearCache();
    setCurrentScreen('login');
  };

  const handleRealGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const email = userInfo.data?.user.email;
      
      if (!email) {
        throw new Error('Could not retrieve email from Google Account.');
      }

      // Check Whitelist
      const whitelistString = 'elaine.batista1105@gmail.com,edbpmc@gmail.com';
      const whitelist = whitelistString.split(',').map(e => e.trim().toLowerCase());

      if (whitelist.includes(email.trim().toLowerCase())) {
        handleLoginSuccess(email);
      } else {
        throw new Error('Email not on whitelist. Access denied.');
      }
    } catch (err: any) {
      console.error('Real Google Sign-In Failed:', err);
      throw err;
    }
  };

  // Open video link (list row or bottom sheet action)
  const handleOpenVideo = async (video: Video) => {
    setCapturedUrl(null);
    setOpenError(null);

    if (testConfig && testConfig.captureExternalLinks) {
      // UI Test Mode capture contract (AC-LIST-03 & AC-MAP-03)
      console.log(`Link Captured: ${video.youtubeUrl}`);
      setCapturedUrl(video.youtubeUrl);
    } else {
      // Production real browser / application launch (AC-LINK-01)
      try {
        await Linking.openURL(video.youtubeUrl);
      } catch (err) {
        console.error('Failed to launch external URL:', err);
        setOpenError('Could not open YouTube link externally.');
      }
    }
  };

  if (!testConfig) {
    return (
      <View style={styles.splash} testID="loading_indicator">
        <ActivityIndicator size="large" color="#EF4444" />
        <Text style={styles.splashText}>Initializing YT Dash...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Screen Routing */}
      {currentScreen === 'login' ? (
        <LoginScreen
          testConfig={testConfig}
          onLoginSuccess={handleLoginSuccess}
          isLoading={status === 'loading'}
          onRealGoogleSignIn={handleRealGoogleSignIn}
        />
      ) : currentScreen === 'home' ? (
        <>
          {status === 'loading' && videos.length === 0 ? (
            <View style={styles.blockingLoader} testID="loading_indicator">
              <ActivityIndicator size="large" color="#EF4444" />
              <Text style={styles.loaderText}>Aggregating latest feeds...</Text>
            </View>
          ) : status === 'error' && videos.length === 0 ? (
            <View style={styles.blockingError} testID="error_view">
              <Text style={styles.errorTitle}>Aggregation Error</Text>
              <Text style={styles.errorSub}>{errorMessage}</Text>
              <Pressable onPress={() => loadFeeds(true)} style={styles.retryBtn} testID="error_retry_button">
                <Text style={styles.retryBtnText}>Retry Aggregation</Text>
              </Pressable>
            </View>
          ) : (
            <HomeScreen
              videos={videos}
              isRefreshing={isRefreshing}
              onRefresh={handleRefresh}
              onLogout={handleLogout}
              onNavigateToMap={() => setCurrentScreen('map')}
              onOpenVideo={handleOpenVideo}
            />
          )}
        </>
      ) : (
        <MapScreen
          videos={videos}
          onNavigateBack={() => setCurrentScreen('home')}
          onOpenVideo={handleOpenVideo}
        />
      )}

      {/* Captured External Link Overlay (AC-LIST-03 / AC-MAP-03 contract) */}
      {capturedUrl && (
        <View style={styles.capturedBanner}>
          <View style={styles.capturedContent}>
            <Text style={styles.capturedLabel}>Captured Link (Test Mode):</Text>
            {/* Element must have testID="external_open_url" with EXACT link text */}
            <Text testID="external_open_url" style={styles.capturedLinkText}>
              {capturedUrl}
            </Text>
          </View>
          <Pressable onPress={() => setCapturedUrl(null)} style={styles.capturedDismiss}>
            <Text style={styles.capturedDismissText}>✕</Text>
          </Pressable>
        </View>
      )}

      {/* Real external open failure message overlay (AC-LINK-01) */}
      {openError && (
        <View style={styles.errorBanner} testID="external_open_error">
          <Text style={styles.errorBannerText}>{openError}</Text>
          <Pressable onPress={() => setOpenError(null)} style={styles.errorBannerDismiss}>
            <Text style={styles.errorBannerDismissText}>✕</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  splash: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 16,
    fontWeight: '500',
  },
  blockingLoader: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 16,
  },
  blockingError: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F87171',
    marginBottom: 8,
  },
  errorSub: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  capturedBanner: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#EF4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 99999,
  },
  capturedContent: {
    flex: 1,
    marginRight: 12,
  },
  capturedLabel: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  capturedLinkText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  capturedDismiss: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  capturedDismissText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorBanner: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 99999,
  },
  errorBannerText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  errorBannerDismiss: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBannerDismissText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
