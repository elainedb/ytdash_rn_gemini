import { Linking } from 'react-native';

export async function openVideoLink(
  url: string,
  captureExternalLinks: boolean,
  setCapturedUrl: (url: string | null) => void,
  setExternalOpenError: (err: string | null) => void
): Promise<void> {
  if (captureExternalLinks) {
    console.log(`[Link] Capturing link in test mode: ${url}`);
    setCapturedUrl(url);
    setExternalOpenError(null);
    return;
  }

  try {
    console.log(`[Link] Attempting real link open: ${url}`);
    // Check if the URL is openable
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      setExternalOpenError(null);
    } else {
      // Fallback: Try opening anyway, as canOpenURL is sometimes overly restrictive on emulators
      await Linking.openURL(url);
      setExternalOpenError(null);
    }
  } catch (err: any) {
    console.error(`[Link] Failed to open link: ${url}`, err);
    // Surface the external_open_error as mandated by constitution
    setExternalOpenError(`Failed to open deep link: ${err?.message || 'unknown error'}`);
  }
}
