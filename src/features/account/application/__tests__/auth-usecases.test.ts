import { RequestOtpUseCase } from '../request-otp.usecase';
import { VerifyOtpUseCase } from '../verify-otp.usecase';
import { GetSessionUseCase } from '../get-session.usecase';
import { SignOutUseCase } from '../sign-out.usecase';
import {
  AuthGateway,
  RequestOtpParams,
  VerifyOtpParams,
  VerifyOtpResult,
  AuthStateChangeCallback,
} from '../../domain/auth.repository';
import { UserSession } from '../../domain/account.entity';
import { ok, err, appError, Result } from '@/core/result';

class FakeAuthGateway implements AuthGateway {
  private session: UserSession | null = null;
  public lastRequestedEmail: string | null = null;

  async requestOtp(params: RequestOtpParams): Promise<Result<{ messageSent: boolean }>> {
    this.lastRequestedEmail = params.email;
    return ok({ messageSent: true });
  }

  async verifyOtp(params: VerifyOtpParams): Promise<Result<VerifyOtpResult>> {
    if (params.token === '123456') {
      this.session = {
        userId: 'usr-123',
        email: params.email,
        farmId: params.localFarmId,
        accessToken: 'fake-jwt',
        expiresAt: Date.now() + 3600000,
      };
      return ok({
        session: this.session,
        assignedFarmId: params.localFarmId,
        isNewFarm: true,
      });
    }
    return err(appError('AUTH_OTP_INVALID', 'Código inválido'));
  }

  async getCurrentSession(): Promise<UserSession | null> {
    return this.session;
  }

  async signOut(): Promise<Result<void>> {
    this.session = null;
    return ok(undefined);
  }

  onAuthStateChange(_callback: AuthStateChangeCallback): () => void {
    return () => {};
  }
}

describe('Auth Use Cases', () => {
  let gateway: FakeAuthGateway;
  let requestOtpUseCase: RequestOtpUseCase;
  let verifyOtpUseCase: VerifyOtpUseCase;
  let getSessionUseCase: GetSessionUseCase;
  let signOutUseCase: SignOutUseCase;

  beforeEach(() => {
    gateway = new FakeAuthGateway();
    requestOtpUseCase = new RequestOtpUseCase(gateway);
    verifyOtpUseCase = new VerifyOtpUseCase(gateway);
    getSessionUseCase = new GetSessionUseCase(gateway);
    signOutUseCase = new SignOutUseCase(gateway);
  });

  describe('RequestOtpUseCase', () => {
    it('deve rejeitar e-mails inválidos', async () => {
      const res = await requestOtpUseCase.execute({ email: 'invalido' });
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('INVALID_EMAIL');
      }
    });

    it('deve solicitar código com sucesso para e-mail válido', async () => {
      const res = await requestOtpUseCase.execute({ email: 'produtor@fazenda.com' });
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.value.messageSent).toBe(true);
      }
      expect(gateway.lastRequestedEmail).toBe('produtor@fazenda.com');
    });

    it('deve aplicar controle de intervalo (cooldown) entre requisições consecutivas', async () => {
      const res1 = await requestOtpUseCase.execute({ email: 'produtor@fazenda.com' });
      expect(res1.ok).toBe(true);

      const res2 = await requestOtpUseCase.execute({ email: 'produtor@fazenda.com' });
      expect(res2.ok).toBe(false);
      if (!res2.ok) {
        expect(res2.error.code).toBe('RATE_LIMIT_EXCEEDED');
      }
    });
  });

  describe('VerifyOtpUseCase', () => {
    it('deve rejeitar tokens que não possuem 6 dígitos', async () => {
      const res = await verifyOtpUseCase.execute({
        email: 'produtor@fazenda.com',
        token: '123',
        localFarmId: 'farm-1',
      });
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('INVALID_TOKEN_FORMAT');
      }
    });

    it('deve validar token correto de 6 dígitos e retornar sessão', async () => {
      const res = await verifyOtpUseCase.execute({
        email: 'produtor@fazenda.com',
        token: '123456',
        localFarmId: 'farm-1',
      });
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.value.session.userId).toBe('usr-123');
        expect(res.value.session.email).toBe('produtor@fazenda.com');
      }
    });

    it('deve falhar para token incorreto', async () => {
      const res = await verifyOtpUseCase.execute({
        email: 'produtor@fazenda.com',
        token: '999999',
        localFarmId: 'farm-1',
      });
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('AUTH_OTP_INVALID');
      }
    });
  });

  describe('GetSessionUseCase e SignOutUseCase', () => {
    it('deve consultar e encerrar sessão adequadamente', async () => {
      expect(await getSessionUseCase.execute()).toBeNull();

      await verifyOtpUseCase.execute({
        email: 'produtor@fazenda.com',
        token: '123456',
        localFarmId: 'farm-1',
      });

      const session = await getSessionUseCase.execute();
      expect(session).not.toBeNull();
      expect(session?.userId).toBe('usr-123');

      const logoutRes = await signOutUseCase.execute();
      expect(logoutRes.ok).toBe(true);
      expect(await getSessionUseCase.execute()).toBeNull();
    });
  });
});
