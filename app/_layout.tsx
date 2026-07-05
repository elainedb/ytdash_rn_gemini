import { Stack } from 'expo-router';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useUIStore } from '../src/store/ui';
import { Text, View, StyleSheet, Pressable, Modal } from 'react-native';

export default function RootLayout() {
  const { externalOpenUrl, externalOpenError, clearExternalState } = useUIStore();

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="home" />
        <Stack.Screen name="map" />
      </Stack>
      
      <Modal transparent visible={!!(externalOpenUrl || externalOpenError)} animationType="fade">
        <View style={styles.modalOverlay}>
          {externalOpenUrl && (
            <View style={styles.banner}>
              <Text testID="external_open_url">{externalOpenUrl}</Text>
              <Pressable onPress={clearExternalState}><Text>Close</Text></Pressable>
            </View>
          )}
          {externalOpenError && (
            <View style={[styles.banner, styles.errorBanner]}>
              <Text testID="external_open_error">{externalOpenError}</Text>
              <Pressable onPress={clearExternalState}><Text>Close</Text></Pressable>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 999,
    elevation: 999,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  banner: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorBanner: {
    backgroundColor: '#ffebee',
  }
});
