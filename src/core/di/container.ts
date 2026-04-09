import { AuthRemoteDataSourceImpl } from '../../features/authentication/data/datasources/auth-remote-datasource';
import { AuthRepositoryImpl } from '../../features/authentication/data/repositories/auth-repository-impl';
import { SignInWithGoogle } from '../../features/authentication/domain/usecases/sign-in-with-google';
import { SignOut } from '../../features/authentication/domain/usecases/sign-out';
import { GetCurrentUser } from '../../features/authentication/domain/usecases/get-current-user';

import { GeocodingService } from '../../features/videos/data/services/geocoding-service';
import { VideosRemoteDataSourceImpl } from '../../features/videos/data/datasources/videos-remote-datasource';
import { VideosLocalDataSourceImpl } from '../../features/videos/data/datasources/videos-local-datasource';
import { VideosRepositoryImpl } from '../../features/videos/data/repositories/videos-repository-impl';
import { GetVideos } from '../../features/videos/domain/usecases/get-videos';
import { GetVideosByChannel } from '../../features/videos/domain/usecases/get-videos-by-channel';
import { GetVideosByCountry } from '../../features/videos/domain/usecases/get-videos-by-country';

export interface Container {
  authRemoteDataSource: AuthRemoteDataSourceImpl;
  authRepository: AuthRepositoryImpl;
  signInWithGoogle: SignInWithGoogle;
  signOut: SignOut;
  getCurrentUser: GetCurrentUser;
  
  geocodingService: GeocodingService;
  videosRemoteDataSource: VideosRemoteDataSourceImpl;
  videosLocalDataSource: VideosLocalDataSourceImpl;
  videosRepository: VideosRepositoryImpl;
  getVideos: GetVideos;
  getVideosByChannel: GetVideosByChannel;
  getVideosByCountry: GetVideosByCountry;
}

const authRemoteDataSource = new AuthRemoteDataSourceImpl();
const authRepository = new AuthRepositoryImpl(authRemoteDataSource);

const geocodingService = new GeocodingService();
const videosRemoteDataSource = new VideosRemoteDataSourceImpl(geocodingService);
const videosLocalDataSource = new VideosLocalDataSourceImpl();
const videosRepository = new VideosRepositoryImpl(videosRemoteDataSource, videosLocalDataSource);

export const container: Container = {
  authRemoteDataSource,
  authRepository,
  signInWithGoogle: new SignInWithGoogle(authRepository),
  signOut: new SignOut(authRepository),
  getCurrentUser: new GetCurrentUser(authRepository),

  geocodingService,
  videosRemoteDataSource,
  videosLocalDataSource,
  videosRepository,
  getVideos: new GetVideos(videosRepository),
  getVideosByChannel: new GetVideosByChannel(videosRepository),
  getVideosByCountry: new GetVideosByCountry(videosRepository),
};

export const initContainer = async () => {
  await videosLocalDataSource.initDb();
};
