import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { router } from 'expo-router';
import Constants from 'expo-constants';

// Config
import config from '../config.json';

const AUTHORIZED_EMAILS = config.authorizedEmails || [];

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    GoogleSignin.configure({
      scopes: ['openid', 'profile', 'email'],
    });

    const checkSignInStatus = async () => {
      try {
        const userInfo = await GoogleSignin.signInSilently();
        if (userInfo) {
          const email = userInfo.data?.user?.email || userInfo.user?.email;
          if (email && AUTHORIZED_EMAILS.includes(email)) {
            router.replace('/main');
          } else {
            await GoogleSignin.signOut();
          }
        }
      } catch {
        // Not signed in
      }
    };

    checkSignInStatus();
  }, []);

  const handleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      const email = userInfo.data?.user?.email || userInfo.user?.email;

      if (email && AUTHORIZED_EMAILS.includes(email)) {
        router.replace('/main');
      } else {
        setErrorMsg('Access denied. Email not authorized.');
        await GoogleSignin.signOut();
      }
    } catch (error: any) {
      if (error.code === 'SIGN_IN_CANCELLED') {
        setErrorMsg('Sign-in cancelled');
      } else if (error.code === 'IN_PROGRESS') {
        setErrorMsg('Sign-in in progress');
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        setErrorMsg('Play services not available');
      } else {
        setErrorMsg(error.message || 'Unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login with Google</Text>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Sign in with Google</Text>
        )}
      </TouchableOpacity>

      {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

      <Text style={styles.debugText}>
        Package: {Constants.expoConfig?.android?.package || 'dev.elainedb.rn_gemini'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#d32f2f',
    marginTop: 20,
    textAlign: 'center',
  },
  debugText: {
    position: 'absolute',
    bottom: 20,
    fontSize: 12,
    color: '#666',
  },
});
