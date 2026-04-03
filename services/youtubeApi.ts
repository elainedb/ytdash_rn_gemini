import { youtubeApiKey } from '../config';
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

const reverseGeocode = async (lat: number, lon: number): Promise<{ city?: string; country?: string }> => {
  try {
    await sleep(1000); // 1-second rate limit
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`, {
      headers: {
        'User-Agent': 'YouTube-Video-App/1.0'
      }
    });
    const data = await response.json();
    return {
      city: data.address?.city || data.address?.town || data.address?.village || data.address?.county,
      country: data.address?.country
    };
  } catch (error) {
    console.error('Geocoding failed', error);
    return {};
  }
};

export const enhanceLocationData = async (videos: VideoData[]): Promise<VideoData[]> => {
  const enhancedVideos = [...videos];
  let updated = false;

  for (let i = 0; i < enhancedVideos.length; i++) {
    const video = enhancedVideos[i];
    if (video.location?.latitude && video.location?.longitude && (!video.location.city || !video.location.country)) {
      const geo = await reverseGeocode(video.location.latitude, video.location.longitude);
      if (geo.city || geo.country) {
        enhancedVideos[i] = {
          ...video,
          location: {
            ...video.location,
            city: geo.city || video.location.city,
            country: geo.country || video.location.country
          }
        };
        updated = true;
      }
    }
  }

  if (updated) {
    await cacheService.saveToCache(enhancedVideos);
  }

  return enhancedVideos;
};

const fetchChannelVideos = async (channelId: string): Promise<VideoData[]> => {
  try {
    // 1. Search for videos
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&maxResults=50&type=video&key=${youtubeApiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.items) return [];

    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');

    // 2. Get detailed metadata
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,recordingDetails,localizations&id=${videoIds}&key=${youtubeApiKey}`;
    const detailsRes = await fetch(detailsUrl);
    const detailsData = await detailsRes.json();

    const videoMap = new Map();
    detailsData.items?.forEach((item: any) => {
      videoMap.set(item.id, item);
    });

    // 3. Combine and map
    return searchData.items.map((item: any): VideoData => {
      const details = videoMap.get(item.id.videoId);
      const snippet = details?.snippet || item.snippet;
      const recordingDetails = details?.recordingDetails;

      let location: VideoData['location'] = undefined;
      
      if (recordingDetails?.location) {
        location = {
          latitude: recordingDetails.location.latitude,
          longitude: recordingDetails.location.longitude,
        };
      } else if (snippet.locationDescription) {
        // Fallback: parses "City, Country"
        const parts = snippet.locationDescription.split(',');
        if (parts.length >= 2) {
          location = {
            city: parts[0].trim(),
            country: parts[1].trim()
          };
        }
      }

      return {
        id: item.id.videoId,
        title: snippet.title,
        channelName: snippet.channelTitle,
        publishedAt: new Date(snippet.publishedAt).toISOString().split('T')[0],
        thumbnailUrl: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
        videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        tags: snippet.tags || [],
        recordingDate: recordingDetails?.recordingDate ? new Date(recordingDetails.recordingDate).toISOString().split('T')[0] : undefined,
        location
      };
    });
  } catch (error) {
    console.error(`Failed to fetch videos for channel ${channelId}`, error);
    return [];
  }
};

export const fetchAllVideos = async (forceRefresh: boolean = false): Promise<VideoData[]> => {
  if (!forceRefresh) {
    const cached = await cacheService.getFromCache();
    if (cached) {
      enhanceLocationData(cached); // Run in background
      return cached;
    }
  }

  const results = await Promise.all(CHANNELS.map(fetchChannelVideos));
  const allVideos = results.flat().sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  
  await cacheService.saveToCache(allVideos);
  return allVideos;
};
