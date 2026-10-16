import { AuthGateway } from '../domain/auth.repository';
import { UserSession } from '../domain/account.entity';

export class GetSessionUseCase {
  constructor(private authGateway: AuthGateway) {}

  async execute(): Promise<UserSession | null> {
    return this.authGateway.getCurrentSession();
  }
}
