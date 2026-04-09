import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { UserModel } from '../models/user-model';
import { AuthException } from '../../../../core/error/exceptions';

export interface AuthRemoteDataSource {
  signInWithGoogle(): Promise<UserModel>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<UserModel | null>;
}

export class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  constructor() {
    GoogleSignin.configure({
      scopes: ['openid', 'profile', 'email'],
    });
  }

  async signInWithGoogle(): Promise<UserModel> {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (response.type === 'success') {
        return UserModel.fromGoogleUser(response.data);
      } else {
        throw new AuthException('Google Sign-In was cancelled');
      }
    } catch (error: any) {
      throw new AuthException(error.message || 'Google Sign-In failed');
    }
  }

  async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
    } catch (error: any) {
      throw new AuthException(error.message || 'Google Sign-Out failed');
    }
  }

  async getCurrentUser(): Promise<UserModel | null> {
    try {
      const userInfo = await GoogleSignin.getCurrentUser();
      if (!userInfo) return null;
      return UserModel.fromGoogleUser(userInfo);
    } catch (error: any) {
      throw new AuthException(error.message || 'Failed to get current user');
    }
  }
}
