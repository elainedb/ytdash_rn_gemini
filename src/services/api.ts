import { getTestConfig } from './config';
import type { Video } from '../store';
import { Platform } from 'react-native';

const channels = require('../../config/channels.json') as { id: string; label: string }[];

export async function fetchVideos(): Promise<Video[]> {
  const config = await getTestConfig();
  const baseUrl = config.apiBaseUrl || 'http://127.0.0.1:8090'; // Default to localhost
  try {
    const res = await fetch(`${baseUrl}/videos`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    const items = data.items || data;
    return items.map((item: any) => ({
      ...item,
      lat: item.location?.lat,
      lng: item.location?.lng,
      youtubeUrl: `https://www.youtube.com/watch?v=${item.id}`,
    }));
  } catch (e: any) {
    throw new Error(`fetch failed: ${e.message}`);
  }
}
