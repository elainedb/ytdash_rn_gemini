import { Linking } from 'react-native';
import { useAppStore } from '../store';

export async function openExternalLink(url: string) {
  const store = useAppStore.getState();
  
  if (store.config?.captureExternalLinks) {
    store.setCapturedUrl(url);
    store.setExternalOpenError(null);
    return;
  }

  try {
    await Linking.openURL(url);
    store.setExternalOpenError(null);
  } catch (error: any) {
    store.setExternalOpenError(`Failed to open URL: ${error?.message || error}`);
  }
}
