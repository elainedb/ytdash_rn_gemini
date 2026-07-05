import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchVideos } from '../services/api';

export type UiState = 'loading' | 'content' | 'empty' | 'error';

export interface Video {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  category: string;
  lat?: number;
  lng?: number;
  thumbnailUrl: string;
  youtubeUrl: string;
}

interface AppState {
  uiState: UiState;
  videos: Video[];
  error: Error | null;
  loadVideos: (forceRefresh?: boolean) => Promise<void>;
  filterCategory: string | null;
  setFilterCategory: (category: string | null) => void;
  sortOrder: 'none' | 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc';
  setSortOrder: (order: 'none' | 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc') => void;
  filteredAndSortedVideos: () => Video[];
  user: { email: string } | null;
  setUser: (user: { email: string } | null) => void;
  externalLinkState: { url?: string; error?: boolean } | null;
  setExternalLinkState: (state: { url?: string; error?: boolean } | null) => void;
}

const CACHE_KEY = 'ytdash_videos_cache';

export const useStore = create<AppState>((set, get) => ({
  uiState: 'loading',
  videos: [],
  error: null,
  filterCategory: null,
  sortOrder: 'none',
  user: null,
  externalLinkState: null,

  setExternalLinkState: (state) => set({ externalLinkState: state }),
  setUser: (user) => set({ user }),

  setFilterCategory: (category) => set({ filterCategory: category }),
  setSortOrder: (order) => set({ sortOrder: order }),

  filteredAndSortedVideos: () => {
    const { videos, filterCategory, sortOrder } = get();
    let result = [...videos];
    if (filterCategory) {
      result = result.filter(v => v.category === filterCategory);
    }
    result.sort((a, b) => {
      switch (sortOrder) {
        case 'date-desc': return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case 'date-asc': return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
        case 'title-asc': return a.title.localeCompare(b.title);
        case 'title-desc': return b.title.localeCompare(a.title);
        case 'none': return 0;
        default: return 0;
      }
    });
    return result;
  },

  loadVideos: async (forceRefresh = false) => {
    set({ uiState: 'loading', error: null });
    try {
      if (!forceRefresh) {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const videos = JSON.parse(cached);
          if (videos.length > 0) {
            set({ videos, uiState: 'content' });
            // continue to fetch in background or just return if not forceRefresh?
            // The spec says "The user can refresh to re-fetch the latest data."
            // "If network is unavailable... shows most recently cached".
            // So we return the cached first, and try to fetch?
            // Let's just use cache if no forceRefresh, else fetch.
          }
        }
      }
      
      const newVideos = await fetchVideos();
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(newVideos));
      set({ videos: newVideos, uiState: newVideos.length === 0 ? 'empty' : 'content' });
    } catch (e) {
      // Offline fallback: if we failed to fetch but have cached, show it.
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const videos = JSON.parse(cached);
        if (videos.length > 0) {
          set({ videos, uiState: 'content', error: e as Error });
          return;
        }
      }
      set({ uiState: 'error', error: e as Error });
    }
  }
}));
