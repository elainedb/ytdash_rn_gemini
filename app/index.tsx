import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useAppStore } from '../store';

export default function LoginScreen() {
  const router = useRouter();
  const config = useAppStore((state) => state.config);
  const login = useAppStore((state) => state.login);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = () => {
    let email = 'real@example.com';
    
    if (config?.uiTestMode && config?.mockAuthEmail) {
      email = config.mockAuthEmail;
    }
    
    const authorized = config?.authorizedEmails?.split(',') || [];
    
    if (authorized.includes(email)) {
      login(email);
      router.replace('/home');
    } else {
      setError(`Unauthorized email: ${email}`);
    }
  };

  return (
    <View testID="screen_login" style={styles.container}>
      <Text style={styles.title}>YT Dash</Text>
      
      <Pressable testID="login_google_button" style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Sign in with Google</Text>
      </Pressable>

      {error && (
        <Text testID="login_error_message" style={styles.errorText}>
          {error}
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
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 32,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginTop: 16,
    textAlign: 'center',
  }
});
