import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { UserModel } from '../models/user-model';
import { AuthException } from '../../../../core/error/exceptions';

export class AuthRemoteDataSource {
  constructor() {
    GoogleSignin.configure({
      scopes: ['openid', 'profile', 'email'],
    });
  }

  async signInWithGoogle(): Promise<UserModel> {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      return UserModel.fromGoogleUser(userInfo);
    } catch (error: any) {
      throw new AuthException(error.message || 'Failed to sign in with Google');
    }
  }

  async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
    } catch (error: any) {
      throw new AuthException(error.message || 'Failed to sign out from Google');
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
