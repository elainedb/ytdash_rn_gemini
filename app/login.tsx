import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import config from '../config.json';

export default function LoginScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const authorizedEmails = config.authorizedEmails || [];

  useEffect(() => {
    GoogleSignin.configure({
      scopes: ['openid', 'profile', 'email'],
    });
    checkIfSignedIn();
  }, []);

  const checkIfSignedIn = async () => {
    try {
      const hasPlayServices = await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: false });
      if (hasPlayServices) {
        const userInfo = await GoogleSignin.signInSilently();
        handleUserInfo(userInfo);
      } else {
        setLoading(false);
      }
    } catch (e) {
      setLoading(false);
    }
  };

  const handleUserInfo = (userInfo: any) => {
    const email = userInfo?.data?.user?.email || userInfo?.user?.email;
    if (email && authorizedEmails.includes(email)) {
      router.replace('/main');
    } else {
      setError('Access denied');
      GoogleSignin.signOut().catch(console.error);
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      handleUserInfo(userInfo);
    } catch (err: any) {
      setLoading(false);
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        setError('Sign in cancelled');
      } else if (err.code === statusCodes.IN_PROGRESS) {
        setError('Sign in in progress');
      } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError('Play Services not available');
      } else {
        setError(err.message || 'Unknown error');
      }
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
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign in with Google</Text>
        )}
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <Text style={styles.debugText}>
        Package: {Constants.expoConfig?.android?.package} | Config OK: {config.youtubeApiKey ? 'Yes' : 'No'}
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
    marginBottom: 30,
    color: '#000',
  },
  button: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#d32f2f',
    marginTop: 20,
  },
  debugText: {
    position: 'absolute',
    bottom: 20,
    fontSize: 12,
    color: '#666',
  },
});
