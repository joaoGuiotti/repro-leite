import { VerifyOtpUseCase } from '../verify-otp.usecase';
import { AuthGateway, VerifyOtpParams, VerifyOtpResult } from '../../domain/auth.repository';
import { ok, Result } from '@/core/result';

class MockBootstrapGateway implements AuthGateway {
  public receivedLocalFarmId: string | null = null;
  public returnAssignedFarmId: string = 'remote-farm-uuid';
  public returnIsNewFarm: boolean = true;

  async requestOtp(): Promise<Result<{ messageSent: boolean }>> {
    return ok({ messageSent: true });
  }

  async verifyOtp(params: VerifyOtpParams): Promise<Result<VerifyOtpResult>> {
    this.receivedLocalFarmId = params.localFarmId;
    return ok({
      session: {
        userId: 'user-xyz',
        email: params.email,
        farmId: this.returnAssignedFarmId,
        accessToken: 'valid-jwt',
        expiresAt: Date.now() + 3600000,
      },
      assignedFarmId: this.returnAssignedFarmId,
      isNewFarm: this.returnIsNewFarm,
    });
  }

  async getCurrentSession() { return null; }
  async signOut() { return ok(undefined); }
  onAuthStateChange() { return () => {}; }
}

describe('Farm Bootstrap Integration (User Story 2)', () => {
  it('deve repassar o farmId local do dispositivo para vinculação no primeiro login', async () => {
    const gateway = new MockBootstrapGateway();
    gateway.returnAssignedFarmId = 'local-farm-123';
    gateway.returnIsNewFarm = true;

    const useCase = new VerifyOtpUseCase(gateway);
    const result = await useCase.execute({
      email: 'produtor@fazenda.com',
      token: '123456',
      localFarmId: 'local-farm-123',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.assignedFarmId).toBe('local-farm-123');
      expect(result.value.isNewFarm).toBe(true);
      expect(result.value.session.farmId).toBe('local-farm-123');
    }
    expect(gateway.receivedLocalFarmId).toBe('local-farm-123');
  });

  it('deve adotar a fazenda remota existente quando o usuário já pertencer a outra fazenda na nuvem', async () => {
    const gateway = new MockBootstrapGateway();
    gateway.returnAssignedFarmId = 'remote-existing-farm-789';
    gateway.returnIsNewFarm = false;

    const useCase = new VerifyOtpUseCase(gateway);
    const result = await useCase.execute({
      email: 'produtor@fazenda.com',
      token: '123456',
      localFarmId: 'local-temp-farm',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.assignedFarmId).toBe('remote-existing-farm-789');
      expect(result.value.isNewFarm).toBe(false);
      expect(result.value.session.farmId).toBe('remote-existing-farm-789');
    }
  });
});
