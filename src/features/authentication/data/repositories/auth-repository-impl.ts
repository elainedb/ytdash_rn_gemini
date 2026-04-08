import { AuthRepository } from '../../domain/repositories/auth-repository';
import { User } from '../../domain/entities/user';
import { Result } from '../../../../core/error/result';
import { AuthRemoteDataSource } from '../datasources/auth-remote-datasource';
import { AuthException } from '../../../../core/error/exceptions';
import { authorizedEmails } from '../../../../config/auth-config';

export class AuthRepositoryImpl implements AuthRepository {
  constructor(private readonly remoteDataSource: AuthRemoteDataSource) {}

  async signInWithGoogle(): Promise<Result<User>> {
    try {
      const userModel = await this.remoteDataSource.signInWithGoogle();
      
      if (!authorizedEmails.includes(userModel.email)) {
        await this.remoteDataSource.signOut();
        return { 
          ok: false, 
          error: { type: 'auth', message: 'Access denied. Your email is not authorized.' } 
        };
      }

      return { ok: true, data: userModel.toEntity() };
    } catch (error: any) {
      return {
        ok: false,
        error: { type: 'auth', message: error.message || 'Failed to sign in' }
      };
    }
  }

  async signOut(): Promise<Result<void>> {
    try {
      await this.remoteDataSource.signOut();
      return { ok: true, data: undefined };
    } catch (error: any) {
      return {
        ok: false,
        error: { type: 'auth', message: error.message || 'Failed to sign out' }
      };
    }
  }

  async getCurrentUser(): Promise<Result<User | null>> {
    try {
      const userModel = await this.remoteDataSource.getCurrentUser();
      
      if (userModel) {
        if (!authorizedEmails.includes(userModel.email)) {
          await this.remoteDataSource.signOut();
          return { ok: true, data: null };
        }
        return { ok: true, data: userModel.toEntity() };
      }
      
      return { ok: true, data: null };
    } catch (error: any) {
      return {
        ok: false,
        error: { type: 'auth', message: error.message || 'Failed to get current user' }
      };
    }
  }
}
