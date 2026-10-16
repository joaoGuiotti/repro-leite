import { Result } from '@/core/result';
import { AuthGateway } from '../domain/auth.repository';

export class SignOutUseCase {
  constructor(private authGateway: AuthGateway) {}

  async execute(): Promise<Result<void>> {
    return this.authGateway.signOut();
  }
}
