import channelsData from '../config/channels.json';

export interface Video {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  category: string;
  thumbnailUrl: string;
  location?: { lat: number; lng: number };
}

export async function fetchVideos(apiBaseUrl: string, apiKey: string): Promise<Video[]> {
  const allVideos: Record<string, Video> = {};

  for (const channel of channelsData) {
    let pageToken = '';
    let hasNextPage = true;

    while (hasNextPage) {
      const searchUrl = `${apiBaseUrl}/youtube/v3/search?key=${apiKey}&channelId=${channel.id}&part=snippet&order=date&type=video&maxResults=50${pageToken ? `&pageToken=${pageToken}` : ''}`;
      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok) throw new Error(`Search API error: ${searchRes.status} ${searchRes.statusText}`);
      
      const searchData = await searchRes.json();
      const items = searchData.items || [];
      
      if (items.length === 0) {
        break;
      }

      // We got IDs. Now fetch details for this batch.
      const videoIds = items.map((item: any) => item.id?.videoId).filter(Boolean);
      if (videoIds.length > 0) {
        // chunk in 50s
        for (let i = 0; i < videoIds.length; i += 50) {
          const chunk = videoIds.slice(i, i + 50);
          const videosUrl = `${apiBaseUrl}/youtube/v3/videos?key=${apiKey}&id=${chunk.join(',')}&part=snippet,contentDetails,recordingDetails`;
          
          const videosRes = await fetch(videosUrl);
          if (!videosRes.ok) throw new Error(`Videos API error: ${videosRes.status} ${videosRes.statusText}`);
          const videosData = await videosRes.json();
          
          for (const v of videosData.items || []) {
            if (!allVideos[v.id]) {
              allVideos[v.id] = {
                id: v.id,
                title: v.snippet?.title || '',
                description: v.snippet?.description || '',
                publishedAt: v.snippet?.publishedAt || '',
                category: channel.label,
                thumbnailUrl: v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || '',
                location: v.recordingDetails?.location ? {
                  lat: v.recordingDetails.location.latitude,
                  lng: v.recordingDetails.location.longitude
                } : undefined
              };
            }
          }
        }
      }

      pageToken = searchData.nextPageToken || '';
      hasNextPage = !!pageToken;
    }
  }

  return Object.values(allVideos);
}
