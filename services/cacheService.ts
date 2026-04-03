import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'youtube_videos_cache';
const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface CachedData {
  videos: any[];
  timestamp: number;
}

export const saveToCache = async (videos: any[]): Promise<void> => {
  try {
    const data: CachedData = {
      videos,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
};

export const getFromCache = async (): Promise<any[] | null> => {
  try {
    const cachedString = await AsyncStorage.getItem(CACHE_KEY);
    if (!cachedString) return null;

    const cachedData: CachedData = JSON.parse(cachedString);
    const age = Date.now() - cachedData.timestamp;

    if (age > CACHE_EXPIRATION_MS) {
      return null;
    }

    return cachedData.videos;
  } catch (error) {
    console.error('Error getting from cache:', error);
    return null;
  }
};

export const clearCache = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

export const isCacheValid = async (): Promise<boolean> => {
  try {
    const cachedString = await AsyncStorage.getItem(CACHE_KEY);
    if (!cachedString) return false;

    const cachedData: CachedData = JSON.parse(cachedString);
    const age = Date.now() - cachedData.timestamp;

    return age <= CACHE_EXPIRATION_MS;
  } catch (error) {
    return false;
  }
};

export const getCacheAge = async (): Promise<number | null> => {
  try {
    const cachedString = await AsyncStorage.getItem(CACHE_KEY);
    if (!cachedString) return null;

    const cachedData: CachedData = JSON.parse(cachedString);
    const ageMs = Date.now() - cachedData.timestamp;
    return Math.floor(ageMs / (1000 * 60)); // Return age in minutes
  } catch (error) {
    return null;
  }
};
