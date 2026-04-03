import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { router } from 'expo-router';

// Fallback emails if config.json is not available
const FALLBACK_EMAILS = [
  'elaine.batista1105@gmail.com', 
  'paulamcunha31@gmail.com', 
  'edbpmc@gmail.com'
];

let authorizedEmails = FALLBACK_EMAILS;
try {
  const config = require('../config.json');
  if (config.authorizedEmails) {
    authorizedEmails = config.authorizedEmails;
  }
} catch {
  console.log('Could not load config.json, using fallback emails');
}

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    GoogleSignin.configure({
      scopes: ['openid', 'profile', 'email'],
    });
    checkSignInStatus();
  }, []);

  const checkSignInStatus = async () => {
    try {
      const isSigned = await GoogleSignin.hasPlayServices();
      if (isSigned) {
        const userInfo = await GoogleSignin.getCurrentUser();
        if (userInfo) {
          const email = userInfo.user?.email;
          if (email && authorizedEmails.includes(email)) {
            router.replace('/main');
          } else if (email) {
            await GoogleSignin.signOut();
            setError('Access denied: Unauthorized email');
          }
        }
      }
    } catch (e) {
      console.log('Status check failed', e);
    }
  };

  const handleSignIn = async () => {
    try {
      setError(null);
      setLoading(true);
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      const email = userInfo.data?.user?.email || (userInfo as any).user?.email;
      
      if (email && authorizedEmails.includes(email)) {
        router.replace('/main');
      } else {
        await GoogleSignin.signOut();
        setError('Access denied: Unauthorized email');
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        setError('Sign in cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        setError('Sign in already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError('Play services not available or outdated');
      } else {
        setError(error.message || 'Unknown error occurred');
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
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign in with Google</Text>
        )}
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Text style={styles.debugText}>
        Package: dev.elainedb.rn_gemini
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
    color: '#333',
  },
  button: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
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
    fontSize: 14,
    textAlign: 'center',
  },
  debugText: {
    position: 'absolute',
    bottom: 20,
    fontSize: 12,
    color: '#999',
  },
});
