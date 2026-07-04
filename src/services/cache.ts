import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video } from './api';

const CACHE_KEY = 'ytdash_videos_cache';

export async function saveVideosToCache(videos: Video[]): Promise<void> {
  try {
    const serialized = JSON.stringify(videos);
    await AsyncStorage.setItem(CACHE_KEY, serialized);
    console.log(`[Cache] Successfully cached ${videos.length} videos`);
  } catch (error) {
    console.error('[Cache] Error saving videos to cache:', error);
  }
}

export async function loadVideosFromCache(): Promise<Video[]> {
  try {
    const serialized = await AsyncStorage.getItem(CACHE_KEY);
    if (serialized) {
      const parsed = JSON.parse(serialized) as Video[];
      console.log(`[Cache] Loaded ${parsed.length} cached videos`);
      return parsed;
    }
  } catch (error) {
    console.error('[Cache] Error loading videos from cache:', error);
  }
  return [];
}
