import { youtubeApiKey } from '@/config.js';
import { VideoData, cacheService } from './cacheService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
        'User-Agent': 'YouTube-Video-App/1.0'
      }
    });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      city: data.address?.city || data.address?.town || data.address?.village || data.address?.county,
      country: data.address?.country
    };
  } catch (error) {
    console.error('Reverse geocode error', error);
    return null;
  }
}

async function fetchChannelVideos(channelId: string): Promise<VideoData[]> {
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&maxResults=50&type=video&key=${youtubeApiKey}`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();
  
  if (!searchData.items || searchData.items.length === 0) return [];

  const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
  const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,recordingDetails,localizations&id=${videoIds}&key=${youtubeApiKey}`;
  const detailsRes = await fetch(detailsUrl);
  const detailsData = await detailsRes.json();

  if (!detailsData.items) return [];

  return detailsData.items.map((item: any): VideoData => {
    const snippet = item.snippet;
    const recordingDetails = item.recordingDetails || {};
    
    let location: VideoData['location'] = undefined;
    if (recordingDetails.location) {
      location = {
        latitude: recordingDetails.location.latitude,
        longitude: recordingDetails.location.longitude,
      };
    } else if (snippet.locationDescription) {
      // Regex fallback
      const match = snippet.locationDescription.match(/^([^,]+),\s*(.+)$/);
      if (match) {
        location = { city: match[1].trim(), country: match[2].trim() };
      } else {
        location = { city: snippet.locationDescription };
      }
    }

    return {
      id: item.id,
      title: snippet.title,
      channelName: snippet.channelTitle,
      publishedAt: snippet.publishedAt.split('T')[0],
      thumbnailUrl: snippet.thumbnails.medium?.url || snippet.thumbnails.default?.url,
      videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
      tags: snippet.tags || [],
      location,
      recordingDate: recordingDetails.recordingDate ? recordingDetails.recordingDate.split('T')[0] : undefined
    };
  });
}

export async function fetchAllVideos(forceRefresh = false): Promise<VideoData[]> {
  if (!forceRefresh) {
    const cached = await cacheService.getFromCache();
    if (cached) {
      // Background enhance location data
      enhanceLocationData(cached).then(enhanced => {
        if (enhanced) cacheService.saveToCache(enhanced);
      });
      return cached;
    }
  }

  try {
    const results = await Promise.all(CHANNELS.map(fetchChannelVideos));
    let allVideos = results.flat();
    allVideos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    
    await cacheService.saveToCache(allVideos);
    
    // Attempt enhancement right away
    const enhanced = await enhanceLocationData(allVideos);
    if (enhanced) {
      await cacheService.saveToCache(enhanced);
      return enhanced;
    }

    return allVideos;
  } catch (error) {
    console.error('Error fetching videos', error);
    // If we fail and didn't force refresh, try to just return cache even if expired as fallback
    if (forceRefresh) {
        try {
            const stored = await AsyncStorage.getItem('youtube_videos_cache');
            if (stored) return JSON.parse(stored).videos;
        } catch(e){}
    }
    throw error;
  }
}

async function enhanceLocationData(videos: VideoData[]): Promise<VideoData[] | null> {
  let changed = false;
  const enhancedVideos = [...videos];

  for (let i = 0; i < enhancedVideos.length; i++) {
    const video = enhancedVideos[i];
    if (video.location?.latitude && video.location?.longitude && !video.location.city && !video.location.country) {
      const geo = await reverseGeocode(video.location.latitude, video.location.longitude);
      if (geo) {
        video.location.city = geo.city || video.location.city;
        video.location.country = geo.country || video.location.country;
        changed = true;
      }
      await sleep(1000); // Rate limit 1 request per second
    }
  }

  return changed ? enhancedVideos : null;
}
