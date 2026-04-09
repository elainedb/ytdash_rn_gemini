import { youtubeApiKey } from '../../../../config/api-config';
import { ServerException } from '../../../../core/error/exceptions';
import { VideoModel } from '../models/video-model';
import { GeocodingService } from '../services/geocoding-service';

export interface VideosRemoteDataSource {
  getVideosFromChannels(channelIds: string[]): Promise<VideoModel[]>;
}

export class VideosRemoteDataSourceImpl implements VideosRemoteDataSource {
  constructor(private readonly geocodingService: GeocodingService) {}

  async getVideosFromChannels(channelIds: string[]): Promise<VideoModel[]> {
    try {
      const allVideoIds = new Set<string>();

      // 1. Fetch search results for all channels in parallel
      await Promise.all(
        channelIds.map(async (channelId) => {
          let pageToken: string | undefined = undefined;
          do {
            let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=50&key=${youtubeApiKey}`;
            if (pageToken) {
              url += `&pageToken=${pageToken}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
              throw new ServerException(`YouTube API search error: ${response.status}`);
            }

            const data = await response.json();
            const items = data.items || [];
            for (const item of items) {
              if (item.id && item.id.videoId) {
                allVideoIds.add(item.id.videoId);
              }
            }

            pageToken = data.nextPageToken;
          } while (pageToken);
        })
      );

      const videoIdsArray = Array.from(allVideoIds);
      const videos: VideoModel[] = [];

      // 2. Fetch detailed metadata in batches of 50
      for (let i = 0; i < videoIdsArray.length; i += 50) {
        const batchIds = videoIdsArray.slice(i, i + 50);
        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,recordingDetails&id=${batchIds.join(',')}&key=${youtubeApiKey}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new ServerException(`YouTube API videos error: ${response.status}`);
        }

        const data = await response.json();
        const items = data.items || [];

        for (const item of items) {
          const snippet = item.snippet || {};
          const recordingDetails = item.recordingDetails || {};
          const locationDescription = recordingDetails.locationDescription;
          const location = recordingDetails.location;

          let latitude: number | null = null;
          let longitude: number | null = null;
          let city: string | null = null;
          let country: string | null = null;

          if (location) {
            latitude = location.latitude ?? null;
            longitude = location.longitude ?? null;
          }

          if (latitude !== null && longitude !== null) {
            const geo = await this.geocodingService.reverseGeocode(
              latitude,
              longitude,
              locationDescription
            );
            city = geo.city;
            country = geo.country;
          } else if (locationDescription) {
             const parts = locationDescription.split(',').map((p: string) => p.trim());
             if (parts.length >= 2) {
               city = parts[0];
               country = parts[parts.length - 1];
             } else if (parts.length === 1) {
               city = parts[0];
             }
          }

          videos.push({
            id: item.id,
            title: snippet.title || '',
            channelName: snippet.channelTitle || '',
            thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
            publishedAt: snippet.publishedAt || new Date().toISOString(),
            tags: snippet.tags || [],
            city,
            country,
            latitude,
            longitude,
            recordingDate: recordingDetails.recordingDate ? new Date(recordingDetails.recordingDate).toISOString() : null,
          });
        }
      }

      // Sort by publishedAt descending
      return videos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    } catch (error) {
      if (error instanceof ServerException) {
        throw error;
      }
      throw new ServerException(error instanceof Error ? error.message : 'Unknown remote error');
    }
  }
}
