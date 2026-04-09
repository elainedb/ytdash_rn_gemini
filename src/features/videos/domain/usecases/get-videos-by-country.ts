import { UseCase } from '../../../../core/usecases/usecase';
import { Result } from '../../../../core/error/result';
import { Video } from '../entities/video';
import { VideosRepository } from '../repositories/videos-repository';

export interface GetVideosByCountryParams {
  country: string;
}

export class GetVideosByCountry implements UseCase<Video[], GetVideosByCountryParams> {
  constructor(private readonly repository: VideosRepository) {}

  async execute(params: GetVideosByCountryParams): Promise<Result<Video[]>> {
    return this.repository.getVideosByCountry(params.country);
  }
}
