import { AuthRemoteDataSource, AuthRemoteDataSourceImpl } from '../../features/authentication/data/datasources/auth-remote-datasource';
import { AuthRepositoryImpl } from '../../features/authentication/data/repositories/auth-repository-impl';
import { AuthRepository } from '../../features/authentication/domain/repositories/auth-repository';
import { GetCurrentUser } from '../../features/authentication/domain/usecases/get-current-user';
import { SignInWithGoogle } from '../../features/authentication/domain/usecases/sign-in-with-google';
import { SignOut } from '../../features/authentication/domain/usecases/sign-out';

import { GeocodingService } from '../../features/videos/data/services/geocoding-service';
import { VideosRemoteDataSource, VideosRemoteDataSourceImpl } from '../../features/videos/data/datasources/videos-remote-datasource';
import { VideosLocalDataSource, VideosLocalDataSourceImpl } from '../../features/videos/data/datasources/videos-local-datasource';
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
  
  geocodingService: GeocodingService;
  videosRemoteDataSource: VideosRemoteDataSource;
  videosLocalDataSource: VideosLocalDataSource;
  videosRepository: VideosRepository;
  getVideos: GetVideos;
  getVideosByChannel: GetVideosByChannel;
  getVideosByCountry: GetVideosByCountry;
}

class DIContainer implements Container {
  private _authRemoteDataSource?: AuthRemoteDataSource;
  private _authRepository?: AuthRepository;
  private _signInWithGoogle?: SignInWithGoogle;
  private _signOut?: SignOut;
  private _getCurrentUser?: GetCurrentUser;

  private _geocodingService?: GeocodingService;
  private _videosRemoteDataSource?: VideosRemoteDataSource;
  private _videosLocalDataSource?: VideosLocalDataSource;
  private _videosRepository?: VideosRepository;
  private _getVideos?: GetVideos;
  private _getVideosByChannel?: GetVideosByChannel;
  private _getVideosByCountry?: GetVideosByCountry;

  get authRemoteDataSource(): AuthRemoteDataSource {
    if (!this._authRemoteDataSource) {
      this._authRemoteDataSource = new AuthRemoteDataSourceImpl();
    }
    return this._authRemoteDataSource;
  }

  get authRepository(): AuthRepository {
    if (!this._authRepository) {
      this._authRepository = new AuthRepositoryImpl(this.authRemoteDataSource);
    }
    return this._authRepository;
  }

  get signInWithGoogle(): SignInWithGoogle {
    if (!this._signInWithGoogle) {
      this._signInWithGoogle = new SignInWithGoogle(this.authRepository);
    }
    return this._signInWithGoogle;
  }

  get signOut(): SignOut {
    if (!this._signOut) {
      this._signOut = new SignOut(this.authRepository);
    }
    return this._signOut;
  }

  get getCurrentUser(): GetCurrentUser {
    if (!this._getCurrentUser) {
      this._getCurrentUser = new GetCurrentUser(this.authRepository);
    }
    return this._getCurrentUser;
  }

  get geocodingService(): GeocodingService {
    if (!this._geocodingService) {
      this._geocodingService = new GeocodingService();
    }
    return this._geocodingService;
  }

  get videosRemoteDataSource(): VideosRemoteDataSource {
    if (!this._videosRemoteDataSource) {
      this._videosRemoteDataSource = new VideosRemoteDataSourceImpl(this.geocodingService);
    }
    return this._videosRemoteDataSource;
  }

  get videosLocalDataSource(): VideosLocalDataSource {
    if (!this._videosLocalDataSource) {
      this._videosLocalDataSource = new VideosLocalDataSourceImpl();
    }
    return this._videosLocalDataSource;
  }

  get videosRepository(): VideosRepository {
    if (!this._videosRepository) {
      this._videosRepository = new VideosRepositoryImpl(
        this.videosRemoteDataSource,
        this.videosLocalDataSource
      );
    }
    return this._videosRepository;
  }

  get getVideos(): GetVideos {
    if (!this._getVideos) {
      this._getVideos = new GetVideos(this.videosRepository);
    }
    return this._getVideos;
  }

  get getVideosByChannel(): GetVideosByChannel {
    if (!this._getVideosByChannel) {
      this._getVideosByChannel = new GetVideosByChannel(this.videosRepository);
    }
    return this._getVideosByChannel;
  }

  get getVideosByCountry(): GetVideosByCountry {
    if (!this._getVideosByCountry) {
      this._getVideosByCountry = new GetVideosByCountry(this.videosRepository);
    }
    return this._getVideosByCountry;
  }
}

export const container = new DIContainer();

export const initContainer = () => {
  // Eagerly initialize singletons if needed
  container.authRemoteDataSource;
  container.videosLocalDataSource;
};
