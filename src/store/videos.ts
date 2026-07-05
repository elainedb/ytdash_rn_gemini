import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAllVideos, Video } from '../api/youtube';

const CACHE_KEY = 'ytdash_videos_cache';

interface VideosState {
  videos: Video[];
  isLoading: boolean;
  error: string | null;
  filterCategory: string | null;
  sortBy: 'date_desc' | 'date_asc' | 'title_asc' | null;
  loadVideos: () => Promise<void>;
  setFilter: (category: string | null) => void;
  setSort: (sort: 'date_desc' | 'date_asc' | 'title_asc' | null) => void;
}

export const useVideosStore = create<VideosState>((set, get) => ({
  videos: [],
  isLoading: false,
  error: null,
  filterCategory: null,
  sortBy: null,

  loadVideos: async () => {
    set({ isLoading: true, error: null });
    try {
      const fetched = await fetchAllVideos();
      set({ videos: fetched, isLoading: false, error: null });
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(fetched));
    } catch (e) {
      // Fallback to cache
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          set({ videos: JSON.parse(cached), isLoading: false, error: null });
        } else {
          set({ isLoading: false, error: (e as Error).message });
        }
      } catch (cacheErr) {
        set({ isLoading: false, error: (e as Error).message });
      }
    }
  },

  setFilter: (category) => {
    set({ filterCategory: category });
  },

  setSort: (sort) => {
    set({ sortBy: sort });
  }
}));

export const selectVisibleVideos = (state: VideosState) => {
  let result = [...state.videos];
  
  if (state.filterCategory) {
    result = result.filter(v => v.category === state.filterCategory);
  }
  
  if (state.sortBy) {
    result.sort((a, b) => {
      if (state.sortBy === 'date_desc') {
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      } else if (state.sortBy === 'date_asc') {
        return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
      } else if (state.sortBy === 'title_asc') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }
  
  return result;
};
