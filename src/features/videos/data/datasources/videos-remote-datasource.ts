import { ServerException } from '../../../../core/error/exceptions';
import { youtubeApiKey } from '../../../../config/api-config';
import { VideoModel } from '../models/video-model';
import { GeocodingService } from '../services/geocoding-service';

export interface VideosRemoteDataSource {
  getVideosFromChannels(channelIds: string[]): Promise<VideoModel[]>;
}

export class VideosRemoteDataSourceImpl implements VideosRemoteDataSource {
  constructor(private geocodingService: GeocodingService) {}

  async getVideosFromChannels(channelIds: string[]): Promise<VideoModel[]> {
    try {
      const allVideoIds = new Set<string>();
      const searchResultsMap = new Map<string, any>();

      // Fetch all videos from all channels in parallel
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
              throw new ServerException(`YouTube Search API error: ${response.status}`);
            }

            const data = await response.json();
            
            for (const item of data.items || []) {
              if (item.id?.videoId) {
                allVideoIds.add(item.id.videoId);
                searchResultsMap.set(item.id.videoId, item.snippet);
              }
            }

            pageToken = data.nextPageToken;
          } while (pageToken);
        })
      );

      const videoIdsArray = Array.from(allVideoIds);
      const detailedVideos: VideoModel[] = [];

      // Batch video requests (max 50 per request)
      for (let i = 0; i < videoIdsArray.length; i += 50) {
        const batchIds = videoIdsArray.slice(i, i + 50);
        const idsParam = batchIds.join(',');
        const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,recordingDetails&id=${idsParam}&key=${youtubeApiKey}`;
        
        const response = await fetch(videoUrl);
        if (!response.ok) {
          throw new ServerException(`YouTube Video API error: ${response.status}`);
        }

        const data = await response.json();
        
        for (const item of data.items || []) {
          const videoId = item.id;
          const searchSnippet = searchResultsMap.get(videoId);
          const snippet = item.snippet || {};
          const recordingDetails = item.recordingDetails || {};
          
          let city: string | null = null;
          let country: string | null = null;
          const latitude = recordingDetails.location?.latitude ?? null;
          const longitude = recordingDetails.location?.longitude ?? null;
          const locationDescription = recordingDetails.locationDescription || null;

          if (latitude !== null && longitude !== null) {
            const geocode = await this.geocodingService.reverseGeocode(latitude, longitude, locationDescription);
            city = geocode.city;
            country = geocode.country;
          }

          detailedVideos.push(
            new VideoModel(
              videoId,
              searchSnippet?.title || snippet.title || '',
              searchSnippet?.channelTitle || snippet.channelTitle || '',
              searchSnippet?.thumbnails?.high?.url || searchSnippet?.thumbnails?.default?.url || '',
              searchSnippet?.publishedAt || snippet.publishedAt || new Date().toISOString(),
              snippet.tags || [],
              city,
              country,
              latitude,
              longitude,
              recordingDetails.recordingDate || null
            )
          );
        }
      }

      detailedVideos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      
      return detailedVideos;
    } catch (error) {
      if (error instanceof ServerException) {
        throw error;
      }
      throw new ServerException(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }
}
