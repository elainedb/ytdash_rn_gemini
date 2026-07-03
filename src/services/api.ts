import { Video, ChannelConfig } from '../types';
import channelsData from '../../config/channels.json';

const CHANNELS: ChannelConfig[] = channelsData;

export interface FetchVideosOptions {
  apiBaseUrl: string;
  apiKey: string;
}

export async function fetchAllVideos(options: FetchVideosOptions): Promise<Video[]> {
  const { apiBaseUrl, apiKey } = options;
  // Clean apiBaseUrl to ensure it does not end with a slash or /youtube/v3
  let baseUrl = apiBaseUrl.trim();
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }
  // The app appends /youtube/v3/<endpoint> itself; do NOT include /youtube/v3 in the base.
  // Ensure we don't duplicate it.
  const apiRoot = baseUrl.includes('/youtube/v3') ? baseUrl : `${baseUrl}/youtube/v3`;

  console.log(`Starting aggregation. apiRoot: ${apiRoot}, Channels:`, CHANNELS);

  const allVideoResults: Array<{ videoId: string; category: string }> = [];

  // Iterate over each channel
  for (const channel of CHANNELS) {
    let pageToken = '';
    let hasNextPage = true;
    let pageCount = 0;

    while (hasNextPage) {
      pageCount++;
      let url = `${apiRoot}/search?key=${encodeURIComponent(apiKey)}&channelId=${encodeURIComponent(channel.id)}&part=snippet&order=date&type=video&maxResults=50`;
      if (pageToken) {
        url += `&pageToken=${encodeURIComponent(pageToken)}`;
      }

      console.log(`Fetching page ${pageCount} of channel ${channel.label} (${channel.id}). URL: ${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch search results for channel ${channel.label}: HTTP ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const items = data.items || [];

      console.log(`Received ${items.length} items from search for channel ${channel.label}.`);

      for (const item of items) {
        const videoId = item.id?.videoId;
        if (videoId) {
          allVideoResults.push({
            videoId,
            category: channel.label,
          });
        }
      }

      pageToken = data.nextPageToken;
      hasNextPage = !!pageToken && items.length > 0;
    }
  }

  // Deduplicate videoIds
  const uniqueVideoMap = new Map<string, string>(); // videoId -> category label
  for (const item of allVideoResults) {
    if (!uniqueVideoMap.has(item.videoId)) {
      uniqueVideoMap.set(item.videoId, item.category);
    }
  }

  const uniqueVideoIds = Array.from(uniqueVideoMap.keys());
  console.log(`Aggregated ${allVideoResults.length} raw videos. Unique count: ${uniqueVideoIds.length}`);

  if (uniqueVideoIds.length === 0) {
    return [];
  }

  // Fetch details for all unique videos in batches of 50
  const finalVideos: Video[] = [];
  const batchSize = 50;

  for (let i = 0; i < uniqueVideoIds.length; i += batchSize) {
    const batchIds = uniqueVideoIds.slice(i, i + batchSize);
    const idsString = batchIds.join(',');

    const url = `${apiRoot}/videos?key=${encodeURIComponent(apiKey)}&id=${encodeURIComponent(idsString)}&part=snippet,contentDetails,recordingDetails`;
    console.log(`Fetching details for batch ${i / batchSize + 1}. URL: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch video details: HTTP ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const items = data.items || [];

    console.log(`Received details for ${items.length} videos in batch.`);

    for (const item of items) {
      const videoId = item.id;
      const snippet = item.snippet || {};
      const recordingDetails = item.recordingDetails || {};
      const location = recordingDetails.location || null;

      const category = uniqueVideoMap.get(videoId) || 'unknown';

      finalVideos.push({
        id: videoId,
        title: snippet.title || '',
        description: snippet.description || '',
        publishedAt: snippet.publishedAt || '',
        category: category,
        thumbnailUrl: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
        lat: location ? location.latitude : null,
        lng: location ? location.longitude : null,
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
      });
    }
  }

  console.log(`Aggregation complete. Fully resolved ${finalVideos.length} videos.`);
  return finalVideos;
}
