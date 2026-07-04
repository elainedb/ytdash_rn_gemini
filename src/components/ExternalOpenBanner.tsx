import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useVideoState } from '../hooks/useVideoState';

export const ExternalOpenBanner: React.FC = () => {
  const { capturedUrl, setCapturedUrl, externalOpenError, setExternalOpenError } = useVideoState();

  if (!capturedUrl && !externalOpenError) return null;

  return (
    <View style={styles.container}>
      {capturedUrl && (
        <View style={styles.banner}>
          <Text style={styles.title}>Captured External Open:</Text>
          <Text testID="external_open_url" style={styles.url}>{capturedUrl}</Text>
          <Pressable style={styles.closeButton} onPress={() => setCapturedUrl(null)}>
            <Text style={styles.closeText}>Dismiss</Text>
          </Pressable>
        </View>
      )}

      {externalOpenError && (
        <View style={[styles.banner, styles.errorBanner]}>
          <Text style={styles.title}>External Open Error:</Text>
          <Text testID="external_open_error" style={styles.errorText}>{externalOpenError}</Text>
          <Pressable style={styles.closeButton} onPress={() => setExternalOpenError(null)}>
            <Text style={styles.closeText}>Dismiss</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    zIndex: 10000,
    gap: 10,
  },
  banner: {
    backgroundColor: '#1E293B',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#475569',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  errorBanner: {
    backgroundColor: '#7F1D1D',
    borderColor: '#EF4444',
  },
  title: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  url: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  closeButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#334155',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
