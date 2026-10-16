import { ok, err, appError, Result } from '@/core/result';
import {
  AuthGateway,
  RequestOtpParams,
  VerifyOtpParams,
  VerifyOtpResult,
  AuthStateChangeCallback,
} from '../domain/auth.repository';
import { UserSession } from '../domain/account.entity';
import { getSupabaseClient, isSupabaseConfigured } from '@/core/network/supabase-client';

export class SupabaseAuthRepository implements AuthGateway {
  private client = getSupabaseClient();

  async requestOtp(params: RequestOtpParams): Promise<Result<{ messageSent: boolean }>> {
    try {
      if (!isSupabaseConfigured()) {
        return err(
          appError(
            'AUTH_NOT_CONFIGURED',
            'Configurações do Supabase não encontradas no ambiente.'
          )
        );
      }

      const { error } = await this.client.auth.signInWithOtp({
        email: params.email.trim(),
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        return err(appError('AUTH_OTP_REQUEST_FAILED', error.message, error));
      }

      return ok({ messageSent: true });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Falha ao solicitar código OTP';
      return err(appError('AUTH_OTP_UNEXPECTED_ERROR', message, e));
    }
  }

  async verifyOtp(params: VerifyOtpParams): Promise<Result<VerifyOtpResult>> {
    try {
      if (!isSupabaseConfigured()) {
        return err(
          appError(
            'AUTH_NOT_CONFIGURED',
            'Configurações do Supabase não encontradas no ambiente.'
          )
        );
      }

      let { data, error } = await this.client.auth.verifyOtp({
        email: params.email.trim(),
        token: params.token.trim(),
        type: 'email',
      });

      // Se falhar como login existente, tenta como novo cadastro (signup)
      if (error || !data.session) {
        const signupAttempt = await this.client.auth.verifyOtp({
          email: params.email.trim(),
          token: params.token.trim(),
          type: 'signup',
        });
        if (!signupAttempt.error && signupAttempt.data.session) {
          data = signupAttempt.data;
          error = null;
        }
      }

      if (error || !data.session || !data.user) {
        return err(
          appError(
            'AUTH_OTP_INVALID',
            error?.message || 'Código de verificação inválido ou expirado.'
          )
        );
      }

      let assignedFarmId = params.localFarmId;
      let isNewFarm = true;

      // Executa RPC para vinculação ou criação silenciosa da fazenda
      try {
        const { data: bootstrapData, error: rpcError } = await this.client.rpc(
          'sync_bootstrap_farm',
          { p_local_farm_id: params.localFarmId }
        );

        if (!rpcError && bootstrapData && typeof bootstrapData === 'object') {
          const res = bootstrapData as { farm_id?: string; is_new_farm?: boolean };
          if (res.farm_id) {
            assignedFarmId = res.farm_id;
            isNewFarm = res.is_new_farm ?? false;
          }
        }
      } catch {
        // Fallback para o farm local caso a RPC ainda não esteja provisionada
      }

      const userSession: UserSession = {
        userId: data.user.id,
        email: data.user.email || params.email,
        farmId: assignedFarmId,
        accessToken: data.session.access_token,
        expiresAt: data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + 3600000,
      };

      return ok({
        session: userSession,
        assignedFarmId,
        isNewFarm,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Falha na verificação do código OTP';
      return err(appError('AUTH_VERIFY_UNEXPECTED_ERROR', message, e));
    }
  }

  async getCurrentSession(): Promise<UserSession | null> {
    try {
      if (!isSupabaseConfigured()) {
        return null;
      }

      const { data, error } = await this.client.auth.getSession();
      if (error || !data.session || !data.session.user) {
        return null;
      }

      let resolvedFarmId = '';
      try {
        const { data: memberData } = await this.client
          .from('farm_members')
          .select('farm_id')
          .eq('user_id', data.session.user.id)
          .is('deleted_at', null)
          .limit(1);

        if (memberData && memberData.length > 0 && memberData[0].farm_id) {
          resolvedFarmId = memberData[0].farm_id;
        }
      } catch {
        // Silencioso se offline
      }

      return {
        userId: data.session.user.id,
        email: data.session.user.email || '',
        farmId: resolvedFarmId,
        accessToken: data.session.access_token,
        expiresAt: data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + 3600000,
      };
    } catch {
      return null;
    }
  }

  async signOut(): Promise<Result<void>> {
    try {
      if (isSupabaseConfigured()) {
        await this.client.auth.signOut();
      }
      return ok(undefined);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erro ao desconectar conta';
      return err(appError('AUTH_SIGNOUT_ERROR', message, e));
    }
  }

  onAuthStateChange(callback: AuthStateChangeCallback): () => void {
    if (!isSupabaseConfigured()) {
      return () => {};
    }

    const { data } = this.client.auth.onAuthStateChange((_event, session) => {
      if (!session || !session.user) {
        callback(null);
      } else {
        callback({
          userId: session.user.id,
          email: session.user.email || '',
          farmId: '',
          accessToken: session.access_token,
          expiresAt: session.expires_at ? session.expires_at * 1000 : Date.now() + 3600000,
        });
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }
}
