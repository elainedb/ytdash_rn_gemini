import { AuthRepository } from '../../domain/repositories/auth-repository';
import { User } from '../../domain/entities/user';
import { AuthRemoteDataSource } from '../datasources/auth-remote-datasource';
import { Result } from '../../../../core/error/result';
import { authorizedEmails } from '../../../../config/auth-config';

export class AuthRepositoryImpl implements AuthRepository {
  constructor(private remoteDataSource: AuthRemoteDataSource) {}

  private validateEmail(email: string): boolean {
    return authorizedEmails.includes(email);
  }

  async signInWithGoogle(): Promise<Result<User>> {
    try {
      const userModel = await this.remoteDataSource.signInWithGoogle();
      
      if (!this.validateEmail(userModel.email)) {
        await this.remoteDataSource.signOut();
        return {
          ok: false,
          error: { type: 'auth', message: 'Access denied. Your email is not authorized.' },
        };
      }
      
      return { ok: true, data: userModel.toEntity() };
    } catch (error: any) {
      return { ok: false, error: { type: 'auth', message: error.message } };
    }
  }

  async signOut(): Promise<Result<void>> {
    try {
      await this.remoteDataSource.signOut();
      return { ok: true, data: undefined };
    } catch (error: any) {
      return { ok: false, error: { type: 'auth', message: error.message } };
    }
  }

  async getCurrentUser(): Promise<Result<User | null>> {
    try {
      const userModel = await this.remoteDataSource.getCurrentUser();
      if (!userModel) {
        return { ok: true, data: null };
      }
      
      if (!this.validateEmail(userModel.email)) {
        await this.remoteDataSource.signOut();
        return { ok: true, data: null };
      }
      
      return { ok: true, data: userModel.toEntity() };
    } catch (error: any) {
      return { ok: false, error: { type: 'auth', message: error.message } };
    }
  }
}
