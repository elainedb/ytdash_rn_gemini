import { VideosRepository } from '../../domain/repositories/videos-repository';
import { Video } from '../../domain/entities/video';
import { VideosRemoteDataSource } from '../datasources/videos-remote-datasource';
import { VideosLocalDataSource } from '../datasources/videos-local-datasource';
import { Result } from '../../../../core/error/result';
import { ServerException, CacheException } from '../../../../core/error/exceptions';

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
            return { ok: true, data: cachedVideos.map(v => v.toEntity()) };
          }
        }
      }

      const remoteVideos = await this.remoteDataSource.getVideosFromChannels(channelIds);
      await this.localDataSource.cacheVideos(remoteVideos);
      return { ok: true, data: remoteVideos.map(v => v.toEntity()) };
    } catch (e: any) {
      if (e instanceof ServerException) {
        try {
          const cachedVideos = await this.localDataSource.getCachedVideos();
          if (cachedVideos.length > 0) {
             return { ok: true, data: cachedVideos.map(v => v.toEntity()) }; // Fallback
          }
        } catch (cacheErr) {
          // Fall through to error
        }
        return { ok: false, error: { type: 'server', message: e.message } };
      }
      return { ok: false, error: { type: 'unexpected', message: e.message || 'Unknown error' } };
    }
  }

  async getVideosByChannel(channelName: string): Promise<Result<Video[]>> {
    try {
      const cachedVideos = await this.localDataSource.getVideosByChannel(channelName);
      return { ok: true, data: cachedVideos.map(v => v.toEntity()) };
    } catch (e: any) {
      return { ok: false, error: { type: 'cache', message: e.message } };
    }
  }

  async getVideosByCountry(country: string): Promise<Result<Video[]>> {
    try {
      const cachedVideos = await this.localDataSource.getVideosByCountry(country);
      return { ok: true, data: cachedVideos.map(v => v.toEntity()) };
    } catch (e: any) {
      return { ok: false, error: { type: 'cache', message: e.message } };
    }
  }

  async clearCache(): Promise<Result<void>> {
    try {
      await this.localDataSource.clearCache();
      return { ok: true, data: undefined };
    } catch (e: any) {
      return { ok: false, error: { type: 'cache', message: e.message } };
    }
  }
}
