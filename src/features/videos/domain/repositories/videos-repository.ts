import { Result } from '../../../../core/error/result';
import { Video } from '../entities/video';

export interface VideosRepository {
  getVideosFromChannels(channelIds: string[], forceRefresh?: boolean): Promise<Result<Video[]>>;
  getVideosByChannel(channelName: string): Promise<Result<Video[]>>;
  getVideosByCountry(country: string): Promise<Result<Video[]>>;
  clearCache(): Promise<Result<void>>;
}
