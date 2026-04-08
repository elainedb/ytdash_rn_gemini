import { Result } from '../../../../core/error/result';
import { UseCase } from '../../../../core/usecases/usecase';
import { User } from '../entities/user';
import { AuthRepository } from '../repositories/auth-repository';

export class GetCurrentUser implements UseCase<User | null, void> {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(): Promise<Result<User | null>> {
    return this.authRepository.getCurrentUser();
  }
}
