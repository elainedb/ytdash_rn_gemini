import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';

// Try to import from config, provide fallback if it fails
let authorizedEmails: string[] = [];
try {
  const config = require('@/config.json');
  authorizedEmails = config.authorizedEmails || [];
} catch (e) {
  authorizedEmails = [
    'elaine.batista1105@gmail.com',
    'paulamcunha31@gmail.com',
    'edbpmc@gmail.com'
  ];
}

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  useEffect(() => {
    GoogleSignin.configure({
      scopes: ['openid', 'profile', 'email'],
    });
    
    checkPlayServicesAndSignInSilently();
  }, []);

  const checkPlayServicesAndSignInSilently = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signInSilently();
      const email = userInfo.data?.user?.email || (userInfo as any).user?.email;
      if (email && authorizedEmails.includes(email)) {
        router.replace('/main');
      }
    } catch (error: any) {
      if (error.code !== statusCodes.SIGN_IN_REQUIRED) {
        console.log('Silent sign in error:', error.message);
      }
    }
  };

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const email = userInfo.data?.user?.email || (userInfo as any).user?.email;
      
      if (email && authorizedEmails.includes(email)) {
        router.replace('/main');
      } else {
        setErrorMsg('Access denied: Email not authorized.');
        await GoogleSignin.signOut();
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled the login flow
      } else if (error.code === statusCodes.IN_PROGRESS) {
        setErrorMsg('Sign in is in progress already');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setErrorMsg('Play services not available or outdated');
      } else {
        setErrorMsg('Unknown error: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const pkgName = Constants.expoConfig?.android?.package || 'Unknown';

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

      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

      <Text style={styles.debugText}>
        Package: {pkgName}{'\n'}
        Emails loaded: {authorizedEmails.length}
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
    color: '#000',
  },
  button: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
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
    bottom: 40,
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
});
