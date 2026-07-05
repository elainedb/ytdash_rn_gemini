import { ENV } from '../config/env';
import channelsData from '../../config/channels.json';

export interface Channel {
  id: string;
  label: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  category: string;
  thumbnailUrl: string;
  youtubeUrl: string;
  lat?: number;
  lng?: number;
}

const channels = channelsData as Channel[];

export async function fetchAllVideos(): Promise<Video[]> {
  const allVideos: Record<string, Video> = {};

  for (const channel of channels) {
    let pageToken = '';
    const channelVideoIds: string[] = [];
    
    // 1. Fetch all pages of search.list for this channel
    while (true) {
      let url = `${ENV.API_BASE_URL}/youtube/v3/search?key=${ENV.API_KEY}&channelId=${channel.id}&part=snippet&order=date&type=video&maxResults=50`;
      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`search.list failed: ${res.status}`);
      }
      
      const data = await res.json();
      const items = data.items || [];
      
      for (const item of items) {
        if (item.id?.videoId) {
          channelVideoIds.push(item.id.videoId);
        }
      }

      pageToken = data.nextPageToken;
      if (!pageToken) {
        break;
      }
    }

    // 2. Fetch video details for these IDs in chunks of 50
    for (let i = 0; i < channelVideoIds.length; i += 50) {
      const chunk = channelVideoIds.slice(i, i + 50);
      const ids = chunk.join(',');
      const vidUrl = `${ENV.API_BASE_URL}/youtube/v3/videos?key=${ENV.API_KEY}&id=${ids}&part=snippet,contentDetails,recordingDetails`;
      
      const res = await fetch(vidUrl);
      if (!res.ok) {
        throw new Error(`videos.list failed: ${res.status}`);
      }
      
      const data = await res.json();
      const items = data.items || [];
      
      for (const item of items) {
        if (!allVideos[item.id]) {
          allVideos[item.id] = {
            id: item.id,
            title: item.snippet?.title || '',
            description: item.snippet?.description || '',
            publishedAt: item.snippet?.publishedAt || '',
            category: channel.label,
            thumbnailUrl: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
            youtubeUrl: `https://www.youtube.com/watch?v=${item.id}`,
            lat: item.recordingDetails?.location?.latitude,
            lng: item.recordingDetails?.location?.longitude,
          };
        }
      }
    }
  }

  const result = Object.values(allVideos);
  return result;
}
