import { youtubeApiKey } from '../config';
import * as cacheService from './cacheService';

const CHANNELS = [
  'UCynoa1DjwnvHAowA_jiMEAQ',
  'UCK0KOjX3beyB9nzonls0cuw',
  'UCACkIrvrGAQ7kuc0hMVwvmA',
  'UCtWRAKKvOEA0CXOue9BG8ZA',
];

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const reverseGeocode = async (lat: number, lon: number): Promise<{ city?: string; country?: string }> => {
  try {
    await sleep(1000); // 1-second rate limit for Nominatim
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'YouTube-Video-App/1.0',
        },
      }
    );
    const data = await response.json();
    return {
      city: data.address?.city || data.address?.town || data.address?.village || data.address?.suburb,
      country: data.address?.country,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {};
  }
};

const parseLocationDescription = (description?: string): { city?: string; country?: string } => {
  if (!description) return {};
  // Simple regex for "City, Country"
  const match = description.match(/([^,]+),\s*([^,]+)/);
  if (match) {
    return {
      city: match[1].trim(),
      country: match[2].trim(),
    };
  }
  return {};
};

export const fetchAllVideos = async (forceRefresh = false): Promise<VideoData[]> => {
  if (!forceRefresh) {
    const cachedVideos = await cacheService.getFromCache();
    if (cachedVideos) {
      // Background enhance location if needed
      enhanceLocationData(cachedVideos).then(enhanced => {
        if (JSON.stringify(enhanced) !== JSON.stringify(cachedVideos)) {
          cacheService.saveToCache(enhanced);
        }
      });
      return cachedVideos;
    }
  }

  try {
    const allVideos: VideoData[] = [];

    const channelPromises = CHANNELS.map(async (channelId) => {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&maxResults=50&type=video&key=${youtubeApiKey}`;
      const response = await fetch(searchUrl);
      const data = await response.json();

      if (data.items) {
        const videoIds = data.items.map((item: any) => item.id.videoId).join(',');
        const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,recordingDetails,localizations&id=${videoIds}&key=${youtubeApiKey}`;
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();

        detailsData.items.forEach((item: any) => {
          const video: VideoData = {
            id: item.id,
            title: item.snippet.title,
            channelName: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt.split('T')[0],
            thumbnailUrl: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
            videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
            tags: item.snippet.tags || [],
            recordingDate: item.recordingDetails?.recordingDate?.split('T')[0],
          };

          if (item.recordingDetails?.location) {
            video.location = {
              latitude: item.recordingDetails.location.latitude,
              longitude: item.recordingDetails.location.longitude,
            };
          } else if (item.snippet.locationDescription) {
            const loc = parseLocationDescription(item.snippet.locationDescription);
            if (loc.city || loc.country) {
              video.location = loc;
            }
          }

          allVideos.push(video);
        });
      }
    });

    await Promise.all(channelPromises);

    // Sort by publication date newest first
    allVideos.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

    // Enhance location data for those with coordinates but missing city/country
    const enhancedVideos = await enhanceLocationData(allVideos);
    
    await cacheService.saveToCache(enhancedVideos);
    return enhancedVideos;
  } catch (error) {
    console.error('Error fetching videos:', error);
    // Fallback to cache even if expired if fetch fails
    const cachedVideos = await cacheService.getFromCache();
    return cachedVideos || [];
  }
};

export const enhanceLocationData = async (videos: VideoData[]): Promise<VideoData[]> => {
  const enhanced = [...videos];
  for (let i = 0; i < enhanced.length; i++) {
    const video = enhanced[i];
    if (video.location?.latitude && video.location?.longitude && !video.location?.city && !video.location?.country) {
      const geoData = await reverseGeocode(video.location.latitude, video.location.longitude);
      if (geoData.city || geoData.country) {
        enhanced[i] = {
          ...video,
          location: {
            ...video.location,
            ...geoData,
          },
        };
      }
    }
  }
  return enhanced;
};
