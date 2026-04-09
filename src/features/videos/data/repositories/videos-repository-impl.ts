import { Result } from '../../../../core/error/result';
import { ServerException } from '../../../../core/error/exceptions';
import { Video } from '../../domain/entities/video';
import { VideosRepository } from '../../domain/repositories/videos-repository';
import { VideosRemoteDataSource } from '../datasources/videos-remote-datasource';
import { VideosLocalDataSource } from '../datasources/videos-local-datasource';
import { toEntity } from '../models/video-model';

export class VideosRepositoryImpl implements VideosRepository {
  constructor(
    private readonly remoteDataSource: VideosRemoteDataSource,
    private readonly localDataSource: VideosLocalDataSource
  ) {}

  async getVideosFromChannels(channelIds: string[], forceRefresh: boolean = false): Promise<Result<Video[]>> {
    try {
      if (!forceRefresh) {
        const isCacheValid = await this.localDataSource.isCacheValid(24 * 60 * 60 * 1000);
        if (isCacheValid) {
          const cachedModels = await this.localDataSource.getCachedVideos();
          if (cachedModels.length > 0) {
            return { ok: true, data: cachedModels.map(toEntity) };
          }
        }
      }

      // Fetch from remote
      try {
        const remoteModels = await this.remoteDataSource.getVideosFromChannels(channelIds);
        await this.localDataSource.cacheVideos(remoteModels);
        return { ok: true, data: remoteModels.map(toEntity) };
      } catch (remoteError) {
        if (remoteError instanceof ServerException) {
          // Fallback to cache even if invalid/expired when remote fails
          const cachedModels = await this.localDataSource.getCachedVideos();
          if (cachedModels.length > 0) {
             return { ok: true, data: cachedModels.map(toEntity) };
          }
          return { ok: false, error: { type: 'server', message: remoteError.message } };
        }
        throw remoteError;
      }
    } catch (error) {
       return { 
         ok: false, 
         error: { type: 'unexpected', message: error instanceof Error ? error.message : 'Unknown error occurred' } 
       };
    }
  }

  async getVideosByChannel(channelName: string): Promise<Result<Video[]>> {
    try {
      const cachedModels = await this.localDataSource.getVideosByChannel(channelName);
      return { ok: true, data: cachedModels.map(toEntity) };
    } catch (error) {
      return { 
        ok: false, 
        error: { type: 'cache', message: error instanceof Error ? error.message : 'Failed to fetch videos by channel from cache' } 
      };
    }
  }

  async getVideosByCountry(country: string): Promise<Result<Video[]>> {
    try {
      const cachedModels = await this.localDataSource.getVideosByCountry(country);
      return { ok: true, data: cachedModels.map(toEntity) };
    } catch (error) {
       return { 
         ok: false, 
         error: { type: 'cache', message: error instanceof Error ? error.message : 'Failed to fetch videos by country from cache' } 
       };
    }
  }

  async clearCache(): Promise<Result<void>> {
    try {
      await this.localDataSource.clearCache();
      return { ok: true, data: undefined };
    } catch (error) {
      return { 
        ok: false, 
        error: { type: 'cache', message: error instanceof Error ? error.message : 'Failed to clear cache' } 
      };
    }
  }
}
