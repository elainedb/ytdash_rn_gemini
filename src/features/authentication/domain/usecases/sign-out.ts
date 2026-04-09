import { UseCase } from '../../../../core/usecases/usecase';
import { Result } from '../../../../core/error/result';
import { AuthRepository } from '../repositories/auth-repository';

export class SignOut implements UseCase<void, void> {
  constructor(private authRepository: AuthRepository) {}

  execute(): Promise<Result<void>> {
    return this.authRepository.signOut();
  }
}
