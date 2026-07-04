import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video } from '../api';

export interface TestConfig {
  uiTestMode: boolean;
  mockAuthEmail?: string;
  apiBaseUrl?: string;
  authorizedEmails?: string;
  captureExternalLinks: boolean;
  apiKey?: string;
}

interface AppState {
  config: TestConfig | null;
  setConfig: (config: TestConfig) => void;

  userEmail: string | null;
  login: (email: string) => void;
  logout: () => void;

  capturedUrl: string | null;
  setCapturedUrl: (url: string | null) => void;
  
  externalOpenError: string | null;
  setExternalOpenError: (error: string | null) => void;

  videos: Video[];
  setVideos: (videos: Video[]) => Promise<void>;
  loadCachedVideos: () => Promise<void>;
  
  loading: boolean;
  setLoading: (loading: boolean) => void;
  
  error: string | null;
  setError: (error: string | null) => void;

  filterCategory: string | null;
  setFilterCategory: (category: string | null) => void;

  sortOption: string | null;
  setSortOption: (option: string | null) => void;
}

const CACHE_KEY = '@ytdash_videos';

export const useAppStore = create<AppState>((set) => ({
  config: null,
  setConfig: (config) => set({ config }),

  userEmail: null,
  login: (email) => set({ userEmail: email }),
  logout: () => set({ userEmail: null }),

  capturedUrl: null,
  setCapturedUrl: (url) => set({ capturedUrl: url }),

  externalOpenError: null,
  setExternalOpenError: (error) => set({ externalOpenError: error }),

  videos: [],
  setVideos: async (videos) => {
    set({ videos });
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(videos));
    } catch (e) {
      console.error('Failed to cache videos', e);
    }
  },
  loadCachedVideos: async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        set({ videos: JSON.parse(cached) });
      }
    } catch (e) {
      console.error('Failed to load cache', e);
    }
  },

  loading: false,
  setLoading: (loading) => set({ loading }),

  error: null,
  setError: (error) => set({ error }),

  filterCategory: null,
  setFilterCategory: (filterCategory) => set({ filterCategory }),

  sortOption: null,
  setSortOption: (sortOption) => set({ sortOption }),
}));
