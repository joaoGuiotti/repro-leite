/**
 * Contrato de Autenticação e Gestão de Sessão (Port)
 * 
 * Define os métodos necessários para autenticação sem senha (OTP)
 * e gerenciamento de sessão criptografada no dispositivo móvel.
 */

import { Result } from '@/core/result';

export interface UserSession {
  userId: string;
  email: string;
  farmId: string;
  accessToken: string;
  expiresAt: number;
}

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
  /**
   * Dispara o envio de código OTP de 6 dígitos para o e-mail informado.
   */
  requestOtp(params: RequestOtpParams): Promise<Result<{ messageSent: boolean }, Error>>;

  /**
   * Valida o código OTP e ativa a sessão do usuário, vinculando a fazenda.
   */
  verifyOtp(params: VerifyOtpParams): Promise<Result<VerifyOtpResult, Error>>;

  /**
   * Retorna a sessão ativa armazenada no dispositivo seguro (Keychain / Keystore).
   */
  getCurrentSession(): Promise<UserSession | null>;

  /**
   * Encerra a sessão atual e remove as credenciais do armazenamento seguro.
   */
  signOut(): Promise<Result<void, Error>>;

  /**
   * Registra um ouvinte para alterações de estado de autenticação.
   */
  onAuthStateChange(callback: AuthStateChangeCallback): () => void;
}
