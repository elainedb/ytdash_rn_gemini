import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import config from '../config.json';

const LoginScreen = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const checkSignInStatus = useCallback(async () => {
    try {
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (isSignedIn) {
        const userInfo = await GoogleSignin.signInSilently();
        const email = userInfo.data?.user?.email || userInfo.user?.email;
        if (email && config.authorizedEmails.includes(email)) {
          router.replace('/main');
        }
      }
    } catch (error) {
      console.log('Silent sign-in check failed', error);
    }
  }, [router]);

  useEffect(() => {
    GoogleSignin.configure({
      scopes: ['openid', 'profile', 'email'],
    });
    checkSignInStatus();
  }, [checkSignInStatus]);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const email = userInfo.data?.user?.email || userInfo.user?.email;

      if (email && config.authorizedEmails.includes(email)) {
        router.replace('/main');
      } else {
        setError('Access denied: Email not authorized.');
        await GoogleSignin.signOut();
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        setError('Sign-in cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        setError('Sign-in in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError('Play Services not available');
      } else {
        setError('An unknown error occurred');
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Login with Google</Text>
        
        <TouchableOpacity 
          style={[styles.signInButton, loading && styles.disabledButton]} 
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.signInButtonText}>Sign in with Google</Text>
          )}
        </TouchableOpacity>

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      <View style={styles.debugInfo}>
        <Text style={styles.debugText}>Package: {Constants.expoConfig?.android?.package}</Text>
        <Text style={styles.debugText}>Config status: {config.youtubeApiKey ? 'Loaded' : 'Missing'}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  signInButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 4,
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 48,
  },
  disabledButton: {
    opacity: 0.7,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#d32f2f',
    marginTop: 20,
    textAlign: 'center',
  },
  debugInfo: {
    padding: 20,
    alignItems: 'center',
  },
  debugText: {
    fontSize: 12,
    color: '#999',
  },
});

export default LoginScreen;
