import { UseCase } from '../../../../core/usecases/usecase';
import { Result } from '../../../../core/error/result';
import { User } from '../entities/user';
import { AuthRepository } from '../repositories/auth-repository';

export class SignInWithGoogle implements UseCase<User, void> {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(): Promise<Result<User>> {
    return this.authRepository.signInWithGoogle();
  }
}
