import { Result } from '../../../../core/error/result';
import { ServerException, CacheException } from '../../../../core/error/exceptions';
import { Video } from '../../domain/entities/video';
import { VideosRepository } from '../../domain/repositories/videos-repository';
import { VideosRemoteDataSource } from '../datasources/videos-remote-datasource';
import { VideosLocalDataSource } from '../datasources/videos-local-datasource';

export class VideosRepositoryImpl implements VideosRepository {
  constructor(
    private remoteDataSource: VideosRemoteDataSource,
    private localDataSource: VideosLocalDataSource
  ) {}

  async getVideosFromChannels(channelIds: string[], forceRefresh: boolean = false): Promise<Result<Video[]>> {
    try {
      if (!forceRefresh) {
        const isCacheValid = await this.localDataSource.isCacheValid();
        if (isCacheValid) {
          const cachedVideos = await this.localDataSource.getCachedVideos();
          if (cachedVideos.length > 0) {
            return { ok: true, data: cachedVideos.map((model) => model.toEntity()) };
          }
        }
      }

      // Fetch from remote
      const remoteVideos = await this.remoteDataSource.getVideosFromChannels(channelIds);
      
      // Cache the results
      await this.localDataSource.cacheVideos(remoteVideos);

      return { ok: true, data: remoteVideos.map((model) => model.toEntity()) };
    } catch (error) {
      if (error instanceof ServerException) {
        // Fallback to cache if possible
        try {
          const cachedVideos = await this.localDataSource.getCachedVideos();
          if (cachedVideos.length > 0) {
            return { ok: true, data: cachedVideos.map((model) => model.toEntity()) };
          }
        } catch (cacheError) {
          // Ignore cache error during fallback
        }
        return { ok: false, error: { type: 'server', message: error.message } };
      }
      if (error instanceof CacheException) {
        return { ok: false, error: { type: 'cache', message: error.message } };
      }
      return { ok: false, error: { type: 'unexpected', message: error instanceof Error ? error.message : 'Unknown error' } };
    }
  }

  async getVideosByChannel(channelName: string): Promise<Result<Video[]>> {
    try {
      const videos = await this.localDataSource.getVideosByChannel(channelName);
      return { ok: true, data: videos.map((model) => model.toEntity()) };
    } catch (error) {
      if (error instanceof CacheException) {
        return { ok: false, error: { type: 'cache', message: error.message } };
      }
      return { ok: false, error: { type: 'unexpected', message: error instanceof Error ? error.message : 'Unknown error' } };
    }
  }

  async getVideosByCountry(country: string): Promise<Result<Video[]>> {
    try {
      const videos = await this.localDataSource.getVideosByCountry(country);
      return { ok: true, data: videos.map((model) => model.toEntity()) };
    } catch (error) {
      if (error instanceof CacheException) {
        return { ok: false, error: { type: 'cache', message: error.message } };
      }
      return { ok: false, error: { type: 'unexpected', message: error instanceof Error ? error.message : 'Unknown error' } };
    }
  }

  async clearCache(): Promise<Result<void>> {
    try {
      await this.localDataSource.clearCache();
      return { ok: true, data: undefined };
    } catch (error) {
      if (error instanceof CacheException) {
        return { ok: false, error: { type: 'cache', message: error.message } };
      }
      return { ok: false, error: { type: 'unexpected', message: error instanceof Error ? error.message : 'Unknown error' } };
    }
  }
}
