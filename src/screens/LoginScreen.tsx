import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator, Image, ImageBackground } from 'react-native';
import { TestConfig } from '../utils/TestConfig';

interface LoginScreenProps {
  testConfig: TestConfig;
  onLoginSuccess: (email: string) => void;
  isLoading: boolean;
  onRealGoogleSignIn: () => Promise<void>;
}

export default function LoginScreen({
  testConfig,
  onLoginSuccess,
  isLoading,
  onRealGoogleSignIn,
}: LoginScreenProps) {
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isLocalLoading, setIsLocalLoading] = useState(false);

  const handleLogin = async () => {
    setErrorText(null);
    setIsLocalLoading(true);

    try {
      if (testConfig.uiTestMode) {
        // Mock Auth Flow
        const email = testConfig.mockAuthEmail || 'allow@example.com';
        console.log(`UI Test Mode Auth Triggered. Email: ${email}`);
        
        // Normal Whitelist Check
        const whitelistString = testConfig.authorizedEmails !== null
          ? testConfig.authorizedEmails
          : 'elaine.batista1105@gmail.com,edbpmc@gmail.com';
        
        const whitelist = whitelistString
          .split(',')
          .map(e => e.trim().toLowerCase())
          .filter(Boolean);

        const isAuthorized = whitelist.includes(email.trim().toLowerCase());

        // Introduce a small delay to simulate network auth
        await new Promise((resolve) => setTimeout(resolve, 500));

        if (isAuthorized) {
          onLoginSuccess(email);
        } else {
          setErrorText('Email not authorized. Access denied.');
        }
      } else {
        // Real Google Sign-In Flow
        await onRealGoogleSignIn();
      }
    } catch (err: any) {
      setErrorText(err.message || 'An authentication error occurred.');
    } finally {
      setIsLocalLoading(false);
    }
  };

  const showLoading = isLoading || isLocalLoading;

  return (
    <View style={styles.container} testID="screen_login">
      {/* Sleek Gradient-like Colored Background with Minimal Card */}
      <View style={styles.card}>
        <View style={styles.logoContainer}>
          {/* A gorgeous premium youtube dashboard logo */}
          <Text style={styles.logoText}>YT</Text>
          <Text style={styles.logoSubtext}>Dash</Text>
        </View>

        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in with Google to access your aggregated YouTube feeds.</Text>

        {errorText && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText} testID="login_error_message">
              {errorText}
            </Text>
          </View>
        )}

        <Pressable
          onPress={handleLogin}
          disabled={showLoading}
          style={({ pressed }) => [
            styles.button,
            showLoading && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
          testID="login_google_button"
        >
          {showLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              {/* Standard clean layout */}
              <Text style={styles.buttonText}>Sign in with Google</Text>
            </>
          )}
        </Pressable>
      </View>
      <Text style={styles.footer}>YT Dash v1.0 • Built with Expo & React Native</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Premium Slate Dark theme
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1E293B', // Sleek contrasting card background
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#EF4444', // YouTube Crimson
    letterSpacing: -1,
  },
  logoSubtext: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F8FAFC', // Slate White
    marginLeft: 2,
    letterSpacing: -1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  errorContainer: {
    width: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    backgroundColor: '#DC2626',
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    backgroundColor: '#475569',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    fontSize: 12,
    color: '#475569',
  },
});
