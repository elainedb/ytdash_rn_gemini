import { VideoModel } from '../models/video-model';
import { GeocodingService } from '../services/geocoding-service';
import { youtubeApiKey } from '../../../../config/api-config';
import { ServerException } from '../../../../core/error/exceptions';

export interface VideosRemoteDataSource {
  getVideosFromChannels(channelIds: string[]): Promise<VideoModel[]>;
}

export class VideosRemoteDataSourceImpl implements VideosRemoteDataSource {
  constructor(private geocodingService: GeocodingService) {}

  async getVideosFromChannels(channelIds: string[]): Promise<VideoModel[]> {
    try {
      const allVideoPromises = channelIds.map(channelId => this.fetchVideosForChannel(channelId));
      const channelResults = await Promise.all(allVideoPromises);
      
      const allVideoIds = channelResults.flat();
      if (allVideoIds.length === 0) return [];

      const detailedVideos = await this.fetchVideoDetails(allVideoIds);
      
      detailedVideos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      
      return detailedVideos;
    } catch (e: any) {
      throw new ServerException(e.message || 'Failed to fetch videos from API');
    }
  }

  private async fetchVideosForChannel(channelId: string): Promise<string[]> {
    let videoIds: string[] = [];
    let nextPageToken: string | undefined = undefined;

    do {
      let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=50&key=${youtubeApiKey}`;
      if (nextPageToken) {
        url += `&pageToken=${nextPageToken}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new ServerException(`YouTube API search failed with status ${response.status}`);
      }
      const data = await response.json();
      
      if (data.items) {
        const ids = data.items.map((item: any) => item.id.videoId).filter(Boolean);
        videoIds = [...videoIds, ...ids];
      }
      nextPageToken = data.nextPageToken;
    } while (nextPageToken);

    return videoIds;
  }

  private async fetchVideoDetails(videoIds: string[]): Promise<VideoModel[]> {
    const batchedIds = this.chunkArray(videoIds, 50);
    const models: VideoModel[] = [];

    for (const batch of batchedIds) {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,recordingDetails&id=${batch.join(',')}&key=${youtubeApiKey}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new ServerException(`YouTube API videos failed with status ${response.status}`);
      }
      const data = await response.json();
      
      if (data.items) {
        for (const item of data.items) {
          const snippet = item.snippet;
          const recordingDetails = item.recordingDetails;
          
          let latitude: number | null = null;
          let longitude: number | null = null;
          let city: string | null = null;
          let country: string | null = null;

          if (recordingDetails?.location?.latitude !== undefined && recordingDetails?.location?.longitude !== undefined) {
            latitude = recordingDetails.location.latitude;
            longitude = recordingDetails.location.longitude;
            
            if (latitude !== null && longitude !== null) {
              const location = await this.geocodingService.getCityAndCountry(latitude, longitude);
              city = location.city;
              country = location.country;
            }
          }

          if (!city && !country && snippet.locationDescription) {
             const parts = snippet.locationDescription.split(',').map((p: string) => p.trim());
             if (parts.length >= 2) {
               city = parts[0];
               country = parts[1];
             } else {
               city = snippet.locationDescription;
             }
          }

          models.push(new VideoModel(
            item.id,
            snippet.title,
            snippet.channelTitle,
            snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
            snippet.publishedAt,
            snippet.tags || [],
            city,
            country,
            latitude,
            longitude,
            recordingDetails?.recordingDate || null
          ));
        }
      }
    }

    return models;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }
}
