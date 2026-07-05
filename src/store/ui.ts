import { create } from 'zustand';
import { Linking } from 'react-native';
import { ENV } from '../config/env';

interface UIState {
  externalOpenUrl: string | null;
  externalOpenError: string | null;
  openExternalLink: (url: string) => Promise<void>;
  clearExternalState: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  externalOpenUrl: null,
  externalOpenError: null,
  openExternalLink: async (url: string) => {
    if (ENV.CAPTURE_EXTERNAL_LINKS) {
      set({ externalOpenUrl: url, externalOpenError: null });
      return;
    }

    try {
      await Linking.openURL(url);
    } catch (error) {
      set({ externalOpenError: 'Cannot open URL' });
    }
  },
  clearExternalState: () => {
    set({ externalOpenUrl: null, externalOpenError: null });
  },
}));
