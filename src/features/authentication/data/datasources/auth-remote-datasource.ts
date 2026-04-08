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
         return UserModel.fromGoogleUser(response.data.user);
      } else if (response.type === 'cancelled') {
         throw new AuthException('Sign in was cancelled.');
      } else {
         throw new AuthException('Sign in failed.');
      }
    } catch (error: any) {
      if (error instanceof AuthException) {
        throw error;
      }
      throw new AuthException(error.message || 'Failed to sign in with Google');
    }
  }

  async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
    } catch (error: any) {
      throw new AuthException(error.message || 'Failed to sign out');
    }
  }

  async getCurrentUser(): Promise<UserModel | null> {
    try {
      const currentUser = GoogleSignin.getCurrentUser();
      if (currentUser) {
        // Handle both older versions where it's wrapped in `user` and newer flat structures
        const userObj = 'user' in currentUser ? (currentUser as any).user : currentUser;
        return UserModel.fromGoogleUser(userObj);
      }
      return null;
    } catch (error: any) {
      throw new AuthException(error.message || 'Failed to get current user');
    }
  }
}
