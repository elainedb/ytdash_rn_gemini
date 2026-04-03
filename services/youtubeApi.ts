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

async function reverseGeocode(latitude: number, longitude: number): Promise<{city?: string, country?: string}> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'YouTube-Video-App/1.0'
      }
    });
    if (!response.ok) return {};
    const data = await response.json();
    const address = data.address || {};
    return {
      city: address.city || address.town || address.village || address.county,
      country: address.country
    };
  } catch (error) {
    console.error('Reverse geocoding failed', error);
    return {};
  }
}

function parseLocationDescription(description: string): {city?: string, country?: string} {
  if (!description) return {};
  const parts = description.split(',').map(s => s.trim());
  if (parts.length >= 2) {
    return {
      city: parts[0],
      country: parts[parts.length - 1]
    };
  }
  // Try to use the whole string as city if no comma
  if (description.trim().length > 0) {
    return { city: description.trim() };
  }
  return {};
}

export async function enhanceLocationData(videos: VideoData[], onUpdate?: (videos: VideoData[]) => void): Promise<VideoData[]> {
  const enhancedVideos = [...videos];
  let madeChanges = false;
  
  for (let i = 0; i < enhancedVideos.length; i++) {
    const video = enhancedVideos[i];
    if (video.location && video.location.latitude && video.location.longitude) {
      if (!video.location.city || !video.location.country) {
        // Rate limiting 1 req/sec
        await sleep(1000);
        const geoData = await reverseGeocode(video.location.latitude, video.location.longitude);
        if (geoData.city || geoData.country) {
          enhancedVideos[i] = {
            ...video,
            location: {
              ...video.location,
              ...geoData
            }
          };
          madeChanges = true;
          if (onUpdate) {
            onUpdate([...enhancedVideos]);
          }
        }
      }
    }
  }
  
  if (madeChanges) {
    await cacheService.saveToCache(enhancedVideos);
  }
  
  return enhancedVideos;
}

export async function fetchAllVideos(forceRefresh = false, onUpdate?: (videos: VideoData[]) => void): Promise<VideoData[]> {
  // Read cache first to preserve already geocoded locations
  const oldCache = await cacheService.getFromCache();
  const oldLocations = new Map<string, any>();
  if (oldCache) {
    for (const v of oldCache) {
      if (v.location?.city || v.location?.country) {
        oldLocations.set(v.id, v.location);
      }
    }
  }

  if (!forceRefresh && oldCache) {
    enhanceLocationData(oldCache, onUpdate).catch(console.error);
    return oldCache;
  }

  const allVideos: VideoData[] = [];

  const fetchChannel = async (channelId: string) => {
    try {
      // 1. Search endpoint
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&order=date&maxResults=50&type=video&channelId=${channelId}&key=${youtubeApiKey}`;
      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok) throw new Error(`Search failed for ${channelId}`);
      const searchData = await searchRes.json();
      
      const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
      if (!videoIds) return;

      // 2. Videos endpoint for details
      const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,recordingDetails,localizations&id=${videoIds}&key=${youtubeApiKey}`;
      const videosRes = await fetch(videosUrl);
      if (!videosRes.ok) throw new Error(`Videos failed for ${channelId}`);
      const videosData = await videosRes.json();

      const detailsMap = new Map<string, any>(videosData.items.map((item: any) => [item.id, item]));

      // 3. Combine
      for (const item of searchData.items) {
        const id = item.id.videoId;
        const details = detailsMap.get(id);
        if (!details) continue;

        const snippet = details.snippet;
        const recordingDetails = details.recordingDetails || {};
        
        let location: any = undefined;
        if (recordingDetails.location) {
          location = {
            latitude: recordingDetails.location.latitude,
            longitude: recordingDetails.location.longitude,
          };
        }
        
        // Spec asks for snippet.locationDescription, but recordingDetails may also have it
        const locationDesc = recordingDetails.locationDescription || snippet.locationDescription;
        if (locationDesc) {
          const parsed = parseLocationDescription(locationDesc);
          if (parsed.city || parsed.country) {
            location = { ...(location || {}), ...parsed };
          }
        }

        // Preserve cached geocoding
        const cachedLoc = oldLocations.get(id);
        if (cachedLoc && (cachedLoc.city || cachedLoc.country)) {
          location = { 
            ...(location || {}), 
            city: cachedLoc.city || location?.city, 
            country: cachedLoc.country || location?.country,
            latitude: cachedLoc.latitude || location?.latitude,
            longitude: cachedLoc.longitude || location?.longitude
          };
        }

        const publishedAt = snippet.publishedAt ? new Date(snippet.publishedAt).toISOString().split('T')[0] : '';
        const recordingDate = recordingDetails.recordingDate ? new Date(recordingDetails.recordingDate).toISOString().split('T')[0] : undefined;

        allVideos.push({
          id,
          title: snippet.title,
          channelName: snippet.channelTitle,
          publishedAt,
          thumbnailUrl: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
          videoUrl: `https://www.youtube.com/watch?v=${id}`,
          tags: snippet.tags || [],
          location,
          recordingDate
        });
      }
    } catch (e) {
      console.error(`Error fetching channel ${channelId}:`, e);
    }
  };

  await Promise.all(CHANNELS.map(fetchChannel));

  // Sort by publishedAt newest first
  allVideos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  await cacheService.saveToCache(allVideos);

  // Enhance location data asynchronously
  enhanceLocationData(allVideos, onUpdate).catch(console.error);

  return allVideos;
}
