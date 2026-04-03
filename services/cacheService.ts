import AsyncStorage from '@react-native-async-storage/async-storage';
import { VideoData } from './youtubeApi';

const CACHE_KEY = 'youtube_videos_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms

interface CachePayload {
  videos: VideoData[];
  timestamp: number;
}

export const cacheService = {
  async saveToCache(videos: VideoData[]): Promise<void> {
    try {
      const payload: CachePayload = {
        videos,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save to cache', e);
    }
  },

  async getFromCache(): Promise<VideoData[] | null> {
    try {
      const data = await AsyncStorage.getItem(CACHE_KEY);
      if (!data) return null;

      const payload: CachePayload = JSON.parse(data);
      if (Date.now() - payload.timestamp > CACHE_TTL) {
        return null;
      }
      return payload.videos;
    } catch (e) {
      console.error('Failed to get from cache', e);
      return null;
    }
  },

  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
    } catch (e) {
      console.error('Failed to clear cache', e);
    }
  },

  async isCacheValid(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(CACHE_KEY);
      if (!data) return false;
      const payload: CachePayload = JSON.parse(data);
      return Date.now() - payload.timestamp <= CACHE_TTL;
    } catch (e) {
      return false;
    }
  },

  async getCacheAge(): Promise<number | null> {
    try {
      const data = await AsyncStorage.getItem(CACHE_KEY);
      if (!data) return null;
      const payload: CachePayload = JSON.parse(data);
      return Math.floor((Date.now() - payload.timestamp) / 60000); // age in minutes
    } catch (e) {
      return null;
    }
  }
};
