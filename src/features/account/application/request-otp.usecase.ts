import { Result, err, appError } from '@/core/result';
import { AuthGateway } from '../domain/auth.repository';
import { isValidEmail } from '../domain/account.entity';

export interface RequestOtpInput {
  email: string;
}

export class RequestOtpUseCase {
  private lastRequestTimestamps: Map<string, number> = new Map();
  private readonly cooldownSeconds: number = 60;

  constructor(private authGateway: AuthGateway) {}

  async execute(input: RequestOtpInput): Promise<Result<{ messageSent: boolean }>> {
    const trimmedEmail = (input.email || '').trim().toLowerCase();

    if (!isValidEmail(trimmedEmail)) {
      return err(
        appError(
          'INVALID_EMAIL',
          'Por favor, informe um endereço de e-mail válido.'
        )
      );
    }

    // Controle de taxa / debounce de 60 segundos
    const now = Date.now();
    const lastRequest = this.lastRequestTimestamps.get(trimmedEmail);
    if (lastRequest && now - lastRequest < this.cooldownSeconds * 1000) {
      const waitTime = Math.ceil((this.cooldownSeconds * 1000 - (now - lastRequest)) / 1000);
      return err(
        appError(
          'RATE_LIMIT_EXCEEDED',
          `Aguarde ${waitTime} segundos antes de solicitar um novo código.`
        )
      );
    }

    const result = await this.authGateway.requestOtp({ email: trimmedEmail });
    if (result.ok) {
      this.lastRequestTimestamps.set(trimmedEmail, now);
    }

    return result;
  }
}
