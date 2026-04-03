import AsyncStorage from '@react-native-async-storage/async-storage';
import { VideoData } from './youtubeApi'; // To be created

const CACHE_KEY = 'youtube_videos_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheData {
  videos: VideoData[];
  timestamp: number;
}

export const cacheService = {
  saveToCache: async (videos: VideoData[]): Promise<void> => {
    try {
      const data: CacheData = {
        videos,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to cache', e);
    }
  },

  getFromCache: async (): Promise<VideoData[] | null> => {
    try {
      const cachedString = await AsyncStorage.getItem(CACHE_KEY);
      if (!cachedString) return null;

      const cachedData: CacheData = JSON.parse(cachedString);
      const isExpired = Date.now() - cachedData.timestamp > CACHE_TTL_MS;

      if (isExpired) {
        await cacheService.clearCache();
        return null;
      }

      return cachedData.videos;
    } catch (e) {
      console.error('Failed to get from cache', e);
      return null;
    }
  },

  clearCache: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
    } catch (e) {
      console.error('Failed to clear cache', e);
    }
  },

  isCacheValid: async (): Promise<boolean> => {
    try {
      const cachedString = await AsyncStorage.getItem(CACHE_KEY);
      if (!cachedString) return false;

      const cachedData: CacheData = JSON.parse(cachedString);
      return Date.now() - cachedData.timestamp <= CACHE_TTL_MS;
    } catch (e) {
      return false;
    }
  },

  getCacheAge: async (): Promise<number | null> => {
    try {
      const cachedString = await AsyncStorage.getItem(CACHE_KEY);
      if (!cachedString) return null;

      const cachedData: CacheData = JSON.parse(cachedString);
      return Math.floor((Date.now() - cachedData.timestamp) / 1000 / 60); // minutes
    } catch (e) {
      return null;
    }
  }
};