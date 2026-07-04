import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useVideoState } from '../hooks/useVideoState';

export const LoginScreen: React.FC = () => {
  const { login, authError, testConfig } = useVideoState();
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    console.log('[UI] Tapped login_google_button');
    
    // In UI Test Mode, skip picker and sign in as mockAuthEmail
    if (testConfig?.uiTestMode) {
      const emailToUse = testConfig.mockAuthEmail || 'allow@example.com';
      console.log(`[UI] [Test Mode] Logging in directly as: ${emailToUse}`);
      await login(emailToUse);
      setLoading(false);
      return;
    }

    // Normal Mode fallback / manual testing helper
    if (emailInput.trim()) {
      await login(emailInput.trim());
    } else {
      // If no text typed, default to a production whitelist email for ease of demo
      await login('elaine.batista1105@gmail.com');
    }
    setLoading(false);
  };

  return (
    <View testID="screen_login" style={styles.container}>
      <View style={styles.card}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>🎥</Text>
          <Text style={styles.logoText}>yt<Text style={styles.logoHighlight}>dash</Text></Text>
        </View>

        <Text style={styles.tagline}>
          Aggregated, geolocated, and cached video streams.
        </Text>

        {testConfig?.uiTestMode ? (
          <View style={styles.testBadge}>
            <Text style={styles.testBadgeText}>🛠️ UI TEST MODE ENABLED</Text>
            <Text style={styles.testBadgeDetail}>
              Mock Auth: {testConfig.mockAuthEmail || 'Not Specified'}
            </Text>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address (Whitelist Mode)</Text>
            <TextInput
              style={styles.input}
              placeholder="enter.email@example.com"
              placeholderTextColor="#64748B"
              keyboardType="email-address"
              autoCapitalize="none"
              value={emailInput}
              onChangeText={setEmailInput}
            />
          </View>
        )}

        {authError && (
          <View style={styles.errorContainer}>
            <Text testID="login_error_message" style={styles.errorText}>
              ⚠️ {authError}
            </Text>
          </View>
        )}

        <Pressable
          testID="login_google_button"
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            loading && styles.buttonDisabled
          ]}
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>
              {testConfig?.uiTestMode ? 'Sign in with Google (Mock)' : 'Sign in with Google'}
            </Text>
          )}
        </Pressable>

        <Text style={styles.footerText}>
          Production login whitelisted to authorized accounts.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Slate 900
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1E293B', // Slate 800
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  logoIcon: {
    fontSize: 28,
  },
  logoText: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  logoHighlight: {
    color: '#6366F1', // Indigo 500
  },
  tagline: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
    gap: 8,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 15,
  },
  testBadge: {
    width: '100%',
    backgroundColor: '#1E1B4B', // Indigo 950
    borderColor: '#4338CA',
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 4,
  },
  testBadgeText: {
    color: '#818CF8',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  testBadgeDetail: {
    color: '#CBD5E1',
    fontSize: 12,
    textAlign: 'center',
  },
  errorContainer: {
    width: '100%',
    backgroundColor: '#7F1D1D', // Red 900
    borderWidth: 1,
    borderColor: '#EF4444',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  button: {
    width: '100%',
    backgroundColor: '#6366F1', // Indigo 500
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonPressed: {
    backgroundColor: '#4F46E5',
    opacity: 0.9,
  },
  buttonDisabled: {
    backgroundColor: '#334155',
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerText: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 24,
  },
});
