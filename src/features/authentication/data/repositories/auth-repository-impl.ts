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
    } catch (error) {
      const message = error instanceof AuthException ? error.message : 'Unexpected error during sign in';
      return { ok: false, error: { type: 'auth', message } };
    }
  }

  async signOut(): Promise<Result<void>> {
    try {
      await this.remoteDataSource.signOut();
      return { ok: true, data: undefined };
    } catch (error) {
      const message = error instanceof AuthException ? error.message : 'Unexpected error during sign out';
      return { ok: false, error: { type: 'auth', message } };
    }
  }

  async getCurrentUser(): Promise<Result<User | null>> {
    try {
      const userModel = await this.remoteDataSource.getCurrentUser();
      if (!userModel) {
        return { ok: true, data: null };
      }

      if (!authorizedEmails.includes(userModel.email)) {
        await this.remoteDataSource.signOut();
        return { ok: true, data: null };
      }

      return { ok: true, data: userModel.toEntity() };
    } catch (error) {
      const message = error instanceof AuthException ? error.message : 'Unexpected error getting current user';
      return { ok: false, error: { type: 'auth', message } };
    }
  }
}
