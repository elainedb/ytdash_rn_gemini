import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAuthStore } from '../src/store/auth';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ENV } from '../src/config/env';

export default function LoginScreen() {
  const { isAuthorized, loginError, login } = useAuthStore();

  useEffect(() => {
    console.log('index.tsx useEffect isAuthorized:', isAuthorized);
    if (isAuthorized) {
      console.log('Routing to /home');
      router.replace('/home');
    }
  }, [isAuthorized]);

  const handleLogin = async () => {
    console.log('LOGIN PRESSED', {
      uiTestMode: ENV.UI_TEST_MODE,
      mockAuthEmail: ENV.MOCK_AUTH_EMAIL,
      authorizedEmails: ENV.AUTHORIZED_EMAILS
    });
    if (ENV.UI_TEST_MODE && ENV.MOCK_AUTH_EMAIL) {
      login(ENV.MOCK_AUTH_EMAIL);
      return;
    }
    
    // In a real app we'd use @react-native-google-signin/google-signin here
    // But since google-services.json isn't provided, we'll mock successful sign-in
    // for non-test mode using the first authorized email
    login(ENV.AUTHORIZED_EMAILS[0] || 'dummy@example.com');
  };

  return (
    <View style={styles.container} testID="screen_login">
      <Text style={styles.title}>YT Dash</Text>
      
      {loginError && (
        <Text style={styles.error} testID="login_error_message">
          {loginError}
        </Text>
      )}

      <Pressable 
        style={styles.button}
        onPress={handleLogin}
        testID="login_google_button"
      >
        <Text style={styles.buttonText}>Sign in with Google</Text>
      </Pressable>
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
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
