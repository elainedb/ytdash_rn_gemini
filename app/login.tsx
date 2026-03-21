import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import config from '@/config.json';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    GoogleSignin.configure({
      scopes: ['openid', 'profile', 'email'],
    });
    checkIfSignedIn();
  }, []);

  const checkIfSignedIn = async () => {
    try {
      const isSigned = await GoogleSignin.hasPlayServices();
      if (!isSigned) return;
      const userInfo = await GoogleSignin.signInSilently();
      if (userInfo) {
        handleUserInfo(userInfo);
      }
    } catch (e) {
      console.log('Not signed in silently', e);
    }
  };

  const handleUserInfo = async (userInfo: any) => {
    const email = userInfo?.data?.user?.email || userInfo?.user?.email;
    const authorized = config.authorizedEmails || [];
    if (email && authorized.includes(email)) {
      router.replace('/main');
    } else {
      setError('Access denied: Email not authorized');
      await GoogleSignin.signOut();
    }
  };

  const signIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      await handleUserInfo(userInfo);
    } catch (e: any) {
      if (e.code === 'SIGN_IN_CANCELLED') {
        setError('Sign-in cancelled');
      } else if (e.code === 'IN_PROGRESS') {
        setError('Sign-in in progress');
      } else if (e.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        setError('Play Services not available');
      } else {
        setError('An unknown error occurred: ' + e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const pkgName = Constants.expoConfig?.android?.package || 'unknown package';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login with Google</Text>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={signIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign in with Google</Text>
        )}
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.debug}>
        Package: {pkgName}{'\n'}
        Config: {config.authorizedEmails ? 'Loaded' : 'Missing'}
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
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  error: {
    color: '#d32f2f',
    marginTop: 20,
    textAlign: 'center',
  },
  debug: {
    position: 'absolute',
    bottom: 30,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
