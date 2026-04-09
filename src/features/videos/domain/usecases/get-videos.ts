import { UseCase } from '../../../../core/usecases/usecase';
import { Result } from '../../../../core/error/result';
import { Video } from '../entities/video';
import { VideosRepository } from '../repositories/videos-repository';

export interface GetVideosParams {
  channelIds: string[];
  forceRefresh: boolean;
}

export class GetVideos implements UseCase<Video[], GetVideosParams> {
  constructor(private readonly repository: VideosRepository) {}

  async execute(params: GetVideosParams): Promise<Result<Video[]>> {
    return this.repository.getVideosFromChannels(params.channelIds, params.forceRefresh);
  }
}
