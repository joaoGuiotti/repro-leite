import { Result, err, appError } from '@/core/result';
import { AuthGateway, VerifyOtpResult } from '../domain/auth.repository';
import { isValidEmail, isValidOtpToken } from '../domain/account.entity';

export interface VerifyOtpInput {
  email: string;
  token: string;
  localFarmId: string;
}

export class VerifyOtpUseCase {
  constructor(private authGateway: AuthGateway) {}

  async execute(input: VerifyOtpInput): Promise<Result<VerifyOtpResult>> {
    const trimmedEmail = (input.email || '').trim().toLowerCase();
    const trimmedToken = (input.token || '').trim();

    if (!isValidEmail(trimmedEmail)) {
      return err(
        appError(
          'INVALID_EMAIL',
          'Endereço de e-mail inválido.'
        )
      );
    }

    if (!isValidOtpToken(trimmedToken)) {
      return err(
        appError(
          'INVALID_TOKEN_FORMAT',
          'O código de verificação deve conter de 6 a 8 dígitos numéricos.'
        )
      );
    }

    return this.authGateway.verifyOtp({
      email: trimmedEmail,
      token: trimmedToken,
      localFarmId: input.localFarmId,
    });
  }
}
