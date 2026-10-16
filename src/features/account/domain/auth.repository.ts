import { Result } from '@/core/result';
import { UserSession } from './account.entity';

export interface RequestOtpParams {
  email: string;
}

export interface VerifyOtpParams {
  email: string;
  token: string;
  localFarmId: string;
}

export interface VerifyOtpResult {
  session: UserSession;
  assignedFarmId: string;
  isNewFarm: boolean;
}

export type AuthStateChangeCallback = (session: UserSession | null) => void;

export interface AuthGateway {
  requestOtp(params: RequestOtpParams): Promise<Result<{ messageSent: boolean }>>;
  verifyOtp(params: VerifyOtpParams): Promise<Result<VerifyOtpResult>>;
  getCurrentSession(): Promise<UserSession | null>;
  signOut(): Promise<Result<void>>;
  onAuthStateChange(callback: AuthStateChangeCallback): () => void;
}
