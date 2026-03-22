import { youtubeApiKey } from '../config.js';
import { cacheService } from './cacheService';

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

const CHANNELS = [
  'UCynoa1DjwnvHAowA_jiMEAQ',
  'UCK0KOjX3beyB9nzonls0cuw',
  'UCACkIrvrGAQ7kuc0hMVwvmA',
  'UCtWRAKKvOEA0CXOue9BG8ZA'
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function reverseGeocode(lat: number, lon: number) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
      headers: {
        'User-Agent': 'YouTube-Video-App/1.0',
      }
    });
    const data = await response.json();
    return {
      city: data.address?.city || data.address?.town || data.address?.village || data.address?.county,
      country: data.address?.country
    };
  } catch (error) {
    return null;
  }
}

async function fetchChannelVideos(channelId: string): Promise<VideoData[]> {
  try {
    const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&maxResults=50&type=video&key=${youtubeApiKey}`);
    const searchData = await searchRes.json();
    if (!searchData.items) return [];

    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
    
    const detailsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,recordingDetails,localizations&id=${videoIds}&key=${youtubeApiKey}`);
    const detailsData = await detailsRes.json();
    if (!detailsData.items) return [];

    return detailsData.items.map((item: any) => {
      const snippet = item.snippet;
      const recordingDetails = item.recordingDetails;
      
      let location: VideoData['location'] = undefined;
      let recordingDate: string | undefined = undefined;

      if (recordingDetails?.location) {
        location = {
          latitude: recordingDetails.location.latitude,
          longitude: recordingDetails.location.longitude,
        };
      } else if (snippet?.locationDescription) {
        const parts = snippet.locationDescription.split(',');
        if (parts.length >= 2) {
          location = {
            city: parts[0].trim(),
            country: parts[parts.length - 1].trim()
          };
        } else if (parts.length === 1) {
          location = {
            city: parts[0].trim(),
            country: parts[0].trim()
          }
        }
      }

      if (recordingDetails?.recordingDate) {
        recordingDate = new Date(recordingDetails.recordingDate).toISOString().split('T')[0];
      }

      return {
        id: item.id,
        title: snippet.title,
        channelName: snippet.channelTitle,
        publishedAt: new Date(snippet.publishedAt).toISOString().split('T')[0],
        thumbnailUrl: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
        videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
        tags: snippet.tags || [],
        location,
        recordingDate,
      };
    });
  } catch (err) {
    console.error(`Error fetching channel ${channelId}:`, err);
    return [];
  }
}

export async function enhanceLocationData(videos: VideoData[]): Promise<VideoData[]> {
  let needsUpdate = false;
  const enhanced = [...videos];
  for (let i = 0; i < enhanced.length; i++) {
    const v = enhanced[i];
    if (v.location?.latitude && v.location?.longitude && (!v.location.city || !v.location.country)) {
      await sleep(1000); // Rate limit for Nominatim
      const geo = await reverseGeocode(v.location.latitude, v.location.longitude);
      if (geo) {
        v.location.city = geo.city || v.location.city;
        v.location.country = geo.country || v.location.country;
        needsUpdate = true;
      }
    }
  }
  if (needsUpdate) {
    await cacheService.saveToCache(enhanced);
  }
  return enhanced;
}

export async function fetchAllVideos(forceRefresh = false): Promise<VideoData[]> {
  if (!forceRefresh) {
    const cached = await cacheService.getFromCache();
    if (cached) {
      enhanceLocationData(cached); // Run in background and update cache later
      return cached;
    }
  }

  const promises = CHANNELS.map(id => fetchChannelVideos(id));
  const results = await Promise.all(promises);
  let allVideos = results.flat();
  
  allVideos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  await cacheService.saveToCache(allVideos);
  
  // Enhancement logic for locations immediately after fetch
  allVideos = await enhanceLocationData(allVideos);
  return allVideos;
}
