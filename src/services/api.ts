import channelsConfig from '../../config/channels.json';

export interface VideoLocation {
  lat: number;
  lng: number;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  category: string; // The source channel's label
  thumbnailUrl: string;
  youtubeUrl: string;
  location: VideoLocation | null;
}

/**
 * Aggregates videos from all channels in config, following pagination, and fetches recording locations.
 */
export async function fetchVideosFromApi(
  apiBaseUrl: string,
  apiKey: string
): Promise<Video[]> {
  const host = apiBaseUrl.replace(/\/+$/, '');
  const baseUrl = `${host}/youtube/v3`;
  
  const allVideosMap = new Map<string, Video>();

  for (const channel of channelsConfig) {
    let pageToken: string | null = null;
    let hasNextPage = true;
    
    while (hasNextPage) {
      let url = `${baseUrl}/search?part=snippet&channelId=${channel.id}&type=video&maxResults=50&key=${apiKey}&order=date`;
      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }

      console.log(`[API] Fetching search for channel: ${channel.label} (${channel.id}), page: ${pageToken || '1'}`);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch search.list for channel ${channel.label}: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const items = data.items || [];

      for (const item of items) {
        const videoId = item.id?.videoId || item.snippet?.resourceId?.videoId;
        if (!videoId) continue;

        const video: Video = {
          id: videoId,
          title: item.snippet?.title || '',
          description: item.snippet?.description || '',
          publishedAt: item.snippet?.publishedAt || '',
          category: channel.label,
          thumbnailUrl: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
          youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
          location: null // Will be populated in the next step
        };

        allVideosMap.set(videoId, video);
      }

      pageToken = data.nextPageToken || null;
      hasNextPage = !!pageToken;
    }
  }

  const allVideoIds = Array.from(allVideosMap.keys());
  if (allVideoIds.length === 0) {
    return [];
  }

  // Chunk video details requests in groups of 50 as permitted by the YouTube API
  const chunkSize = 50;
  for (let i = 0; i < allVideoIds.length; i += chunkSize) {
    const chunkIds = allVideoIds.slice(i, i + chunkSize);
    const idsString = chunkIds.join(',');
    const detailsUrl = `${baseUrl}/videos?part=snippet,contentDetails,recordingDetails&id=${idsString}&key=${apiKey}`;

    console.log(`[API] Fetching details for ${chunkIds.length} videos`);
    const detailsResponse = await fetch(detailsUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });

    if (!detailsResponse.ok) {
      const errorText = await detailsResponse.text();
      throw new Error(`Failed to fetch videos.list details: ${detailsResponse.status} ${errorText}`);
    }

    const detailsData = await detailsResponse.json();
    const detailsItems = detailsData.items || [];

    for (const detailItem of detailsItems) {
      const videoId = detailItem.id;
      const existingVideo = allVideosMap.get(videoId);
      if (existingVideo) {
        const locationDetails = detailItem.recordingDetails?.location;
        if (locationDetails && typeof locationDetails.latitude === 'number' && typeof locationDetails.longitude === 'number') {
          existingVideo.location = {
            lat: locationDetails.latitude,
            lng: locationDetails.longitude
          };
        }
      }
    }
  }

  return Array.from(allVideosMap.values());
}
