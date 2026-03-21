import { youtubeApiKey } from '@/config.js';
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

async function fetchChannelVideos(channelId: string): Promise<VideoData[]> {
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&maxResults=50&type=video&key=${youtubeApiKey}`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();
  
  if (!searchData.items || searchData.items.length === 0) return [];
  
  const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
  
  const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,recordingDetails,localizations&id=${videoIds}&key=${youtubeApiKey}`;
  const videosRes = await fetch(videosUrl);
  const videosData = await videosRes.json();
  
  if (!videosData.items) return [];

  return videosData.items.map((item: any) => {
    const id = item.id;
    const snippet = item.snippet;
    const recordingDetails = item.recordingDetails;
    
    let location: VideoData['location'] = undefined;
    if (recordingDetails?.location) {
      location = {
        latitude: recordingDetails.location.latitude,
        longitude: recordingDetails.location.longitude,
      };
    } else if (snippet.locationDescription) {
      const match = snippet.locationDescription.match(/^([^,]+),\s*([^,]+)$/);
      if (match) {
        location = {
          city: match[1].trim(),
          country: match[2].trim()
        };
      } else {
        location = { city: snippet.locationDescription };
      }
    }
    
    return {
      id,
      title: snippet.title,
      channelName: snippet.channelTitle,
      publishedAt: new Date(snippet.publishedAt).toISOString().split('T')[0],
      thumbnailUrl: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
      videoUrl: `https://www.youtube.com/watch?v=${id}`,
      tags: snippet.tags || [],
      location,
      recordingDate: recordingDetails?.recordingDate 
        ? new Date(recordingDetails.recordingDate).toISOString().split('T')[0]
        : undefined,
    };
  });
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function enhanceLocationData(videos: VideoData[]): Promise<VideoData[]> {
  const updatedVideos = [...videos];
  let needUpdate = false;
  
  for (let i = 0; i < updatedVideos.length; i++) {
    const video = updatedVideos[i];
    if (video.location && video.location.latitude && video.location.longitude && (!video.location.city || !video.location.country)) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${video.location.latitude}&lon=${video.location.longitude}`, {
          headers: { 'User-Agent': 'YouTube-Video-App/1.0' }
        });
        const data = await res.json();
        
        if (data && data.address) {
          updatedVideos[i].location = {
            ...video.location,
            city: data.address.city || data.address.town || data.address.village,
            country: data.address.country,
          };
          needUpdate = true;
        }
        await sleep(1000);
      } catch (err) {
        console.warn('Reverse geocoding failed', err);
      }
    }
  }
  
  if (needUpdate) {
    await cacheService.saveToCache(updatedVideos);
  }
  return updatedVideos;
}

export async function fetchAllVideos(forceRefresh: boolean = false): Promise<VideoData[]> {
  if (!forceRefresh) {
    const cached = await cacheService.getFromCache();
    if (cached) {
      enhanceLocationData(cached);
      return cached;
    }
  }
  
  const allPromises = CHANNELS.map(channelId => fetchChannelVideos(channelId));
  const results = await Promise.all(allPromises);
  const merged = results.flat();
  
  merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  
  await cacheService.saveToCache(merged);
  enhanceLocationData(merged);
  
  return merged;
}
