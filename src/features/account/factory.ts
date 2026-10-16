import { AuthGateway } from './domain/auth.repository';
import { SupabaseAuthRepository } from './infra/supabase-auth.repository';
import { RequestOtpUseCase } from './application/request-otp.usecase';
import { VerifyOtpUseCase } from './application/verify-otp.usecase';
import { GetSessionUseCase } from './application/get-session.usecase';
import { SignOutUseCase } from './application/sign-out.usecase';

export interface AccountUseCases {
  requestOtpUseCase: RequestOtpUseCase;
  verifyOtpUseCase: VerifyOtpUseCase;
  getSessionUseCase: GetSessionUseCase;
  signOutUseCase: SignOutUseCase;
  authGateway: AuthGateway;
}

let cachedUseCases: AccountUseCases | null = null;

export function getAccountUseCases(gateway?: AuthGateway): AccountUseCases {
  if (gateway) {
    return {
      requestOtpUseCase: new RequestOtpUseCase(gateway),
      verifyOtpUseCase: new VerifyOtpUseCase(gateway),
      getSessionUseCase: new GetSessionUseCase(gateway),
      signOutUseCase: new SignOutUseCase(gateway),
      authGateway: gateway,
    };
  }

  if (!cachedUseCases) {
    const authGateway = new SupabaseAuthRepository();
    cachedUseCases = {
      requestOtpUseCase: new RequestOtpUseCase(authGateway),
      verifyOtpUseCase: new VerifyOtpUseCase(authGateway),
      getSessionUseCase: new GetSessionUseCase(authGateway),
      signOutUseCase: new SignOutUseCase(authGateway),
      authGateway,
    };
  }

  return cachedUseCases;
}
