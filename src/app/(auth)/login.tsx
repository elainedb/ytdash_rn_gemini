import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { login } from '../../services/auth';
import { getTestConfig } from '../../services/config';
import { useStore } from '../../store';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setUser = useStore(state => state.setUser);
  
  // Real Google Sign-in hook
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: 'dummy-android-client-id.apps.googleusercontent.com',
    iosClientId: 'dummy-ios-client-id.apps.googleusercontent.com',
    webClientId: 'dummy-web-client-id.apps.googleusercontent.com',
  });

  // Handle the response if real auth is used
  React.useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        // Fetch user info
        fetch('https://www.googleapis.com/userinfo/v2/me', {
          headers: { Authorization: `Bearer ${authentication.accessToken}` },
        })
          .then(res => res.json())
          .then(async userInfo => {
            if (userInfo.email) {
              await handleLogin(userInfo.email);
            }
          })
          .catch(e => setErrorMsg("Failed to fetch user info"));
      }
    }
  }, [response]);

  const handleLogin = async (email: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const user = await login(email);
      setUser(user);
    } catch (e: any) {
      setErrorMsg(e.message === 'Unauthorized_email' ? 'Unauthorized email' : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const onGoogleButtonPress = async () => {
    const config = await getTestConfig();
    if (config.uiTestMode && config.mockAuthEmail) {
      await handleLogin(config.mockAuthEmail);
      return;
    }
    
    // Trigger real flow
    promptAsync();
  };

  return (
    <View style={styles.container} testID="screen_login">
      <Text style={styles.title}>ytdash</Text>
      
      {loading ? (
        <ActivityIndicator size="large" testID="loading_indicator" />
      ) : (
        <Pressable 
          style={styles.button} 
          testID="login_google_button"
          onPress={onGoogleButtonPress}
        >
          <Text style={styles.buttonText}>Sign in with Google</Text>
        </Pressable>
      )}

      {errorMsg && (
        <Text style={styles.error} testID="login_error_message">
          {errorMsg}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  error: {
    marginTop: 20,
    color: 'red',
    fontSize: 16,
  },
});
