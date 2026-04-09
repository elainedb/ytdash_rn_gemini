import { AuthRemoteDataSource } from '../../features/authentication/data/datasources/auth-remote-datasource';
import { AuthRepositoryImpl } from '../../features/authentication/data/repositories/auth-repository-impl';
import { AuthRepository } from '../../features/authentication/domain/repositories/auth-repository';
import { GetCurrentUser } from '../../features/authentication/domain/usecases/get-current-user';
import { SignInWithGoogle } from '../../features/authentication/domain/usecases/sign-in-with-google';
import { SignOut } from '../../features/authentication/domain/usecases/sign-out';

import { VideosRemoteDataSource, VideosRemoteDataSourceImpl } from '../../features/videos/data/datasources/videos-remote-datasource';
import { VideosLocalDataSource, VideosLocalDataSourceImpl } from '../../features/videos/data/datasources/videos-local-datasource';
import { GeocodingService } from '../../features/videos/data/services/geocoding-service';
import { VideosRepositoryImpl } from '../../features/videos/data/repositories/videos-repository-impl';
import { VideosRepository } from '../../features/videos/domain/repositories/videos-repository';
import { GetVideos } from '../../features/videos/domain/usecases/get-videos';
import { GetVideosByChannel } from '../../features/videos/domain/usecases/get-videos-by-channel';
import { GetVideosByCountry } from '../../features/videos/domain/usecases/get-videos-by-country';

export interface Container {
  authRemoteDataSource: AuthRemoteDataSource;
  authRepository: AuthRepository;
  signInWithGoogle: SignInWithGoogle;
  signOut: SignOut;
  getCurrentUser: GetCurrentUser;
  
  videosRemoteDataSource: VideosRemoteDataSource;
  videosLocalDataSource: VideosLocalDataSource;
  videosRepository: VideosRepository;
  getVideos: GetVideos;
  getVideosByChannel: GetVideosByChannel;
  getVideosByCountry: GetVideosByCountry;
}

const createContainer = (): Container => {
  const authRemoteDataSource = new AuthRemoteDataSource();
  const authRepository = new AuthRepositoryImpl(authRemoteDataSource);
  
  const videosRemoteDataSource = new VideosRemoteDataSourceImpl(new GeocodingService());
  const videosLocalDataSource = new VideosLocalDataSourceImpl();
  const videosRepository = new VideosRepositoryImpl(videosRemoteDataSource, videosLocalDataSource);

  return {
    authRemoteDataSource,
    authRepository,
    signInWithGoogle: new SignInWithGoogle(authRepository),
    signOut: new SignOut(authRepository),
    getCurrentUser: new GetCurrentUser(authRepository),
    
    videosRemoteDataSource,
    videosLocalDataSource,
    videosRepository,
    getVideos: new GetVideos(videosRepository),
    getVideosByChannel: new GetVideosByChannel(videosRepository),
    getVideosByCountry: new GetVideosByCountry(videosRepository),
  };
};

let _container: Container | null = null;

export const initContainer = () => {
  if (!_container) {
    _container = createContainer();
  }
};

export const getContainer = (): Container => {
  if (!_container) {
    initContainer();
  }
  return _container!;
};

// Export container for direct usage
export const container = new Proxy({} as Container, {
  get: (_, prop: keyof Container) => getContainer()[prop]
});
