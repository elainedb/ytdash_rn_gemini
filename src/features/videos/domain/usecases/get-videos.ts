import { UseCase } from '../../../../core/usecases/usecase';
import { Result } from '../../../../core/error/result';
import { Video } from '../entities/video';
import { VideosRepository } from '../repositories/videos-repository';

export interface GetVideosParams {
  channelIds: string[];
  forceRefresh: boolean;
}

export class GetVideos implements UseCase<Video[], GetVideosParams> {
  constructor(private videosRepository: VideosRepository) {}

  execute(params: GetVideosParams): Promise<Result<Video[]>> {
    return this.videosRepository.getVideosFromChannels(params.channelIds, params.forceRefresh);
  }
}
