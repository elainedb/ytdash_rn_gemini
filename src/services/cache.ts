import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video } from '../types';

const CACHE_KEY = 'ytdash_videos_cache';

export async function saveVideosToCache(videos: Video[]): Promise<void> {
  try {
    const jsonValue = JSON.stringify(videos);
    await AsyncStorage.setItem(CACHE_KEY, jsonValue);
    console.log(`Saved ${videos.length} videos to persistent cache.`);
  } catch (e) {
    console.error('Failed to save videos to cache:', e);
  }
}

export async function loadCachedVideos(): Promise<Video[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(CACHE_KEY);
    if (jsonValue != null) {
      const videos: Video[] = JSON.parse(jsonValue);
      console.log(`Loaded ${videos.length} videos from persistent cache.`);
      return videos;
    }
  } catch (e) {
    console.error('Failed to load videos from cache:', e);
  }
  return [];
}

export async function clearCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch (e) {
    console.error('Failed to clear cache:', e);
  }
}
