import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VideoData {
  id: string;
  title: string;
  channelName: string;
  publishedAt: string;
  thumbnailUrl: string;
  videoUrl: string;
  tags: string[];
  location?: {
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  recordingDate?: string;
}

interface CacheData {
  videos: VideoData[];
  timestamp: number;
}

const CACHE_KEY = 'youtube_videos_cache';
const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export const cacheService = {
  async saveToCache(videos: VideoData[]): Promise<void> {
    const data: CacheData = {
      videos,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
  },

  async getFromCache(): Promise<VideoData[] | null> {
    try {
      const stored = await AsyncStorage.getItem(CACHE_KEY);
      if (!stored) return null;

      const data: CacheData = JSON.parse(stored);
      if (!this.isCacheValid(data.timestamp)) {
        await this.clearCache();
        return null;
      }

      return data.videos;
    } catch (e) {
      console.error('Cache read error', e);
      return null;
    }
  },

  async clearCache(): Promise<void> {
    await AsyncStorage.removeItem(CACHE_KEY);
  },

  isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < CACHE_EXPIRATION_MS;
  },

  async getCacheAge(): Promise<number> {
    const stored = await AsyncStorage.getItem(CACHE_KEY);
    if (!stored) return -1;
    const data: CacheData = JSON.parse(stored);
    return Math.floor((Date.now() - data.timestamp) / 60000);
  }
};
