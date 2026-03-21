import AsyncStorage from '@react-native-async-storage/async-storage';
import { VideoData } from './youtubeApi';

const CACHE_KEY = 'youtube_videos_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheData {
  videos: VideoData[];
  timestamp: number;
}

export const cacheService = {
  async saveToCache(videos: VideoData[]): Promise<void> {
    const data: CacheData = {
      videos,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
  },

  async getFromCache(): Promise<VideoData[] | null> {
    const json = await AsyncStorage.getItem(CACHE_KEY);
    if (!json) return null;
    const data: CacheData = JSON.parse(json);
    if (this.isCacheValid(data.timestamp)) {
      return data.videos;
    }
    return null;
  },

  async clearCache(): Promise<void> {
    await AsyncStorage.removeItem(CACHE_KEY);
  },

  isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < CACHE_TTL_MS;
  },

  async getCacheAge(): Promise<number | null> {
    const json = await AsyncStorage.getItem(CACHE_KEY);
    if (!json) return null;
    const data: CacheData = JSON.parse(json);
    return Math.floor((Date.now() - data.timestamp) / 60000);
  }
};
