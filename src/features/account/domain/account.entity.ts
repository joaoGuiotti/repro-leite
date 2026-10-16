export interface UserAccount {
  id: string;
  email: string;
  createdAt: string;
}

export interface UserSession {
  userId: string;
  email: string;
  farmId: string;
  accessToken: string;
  expiresAt: number;
}

export interface FarmMembership {
  id: string;
  farmId: string;
  userId: string;
  role: 'owner' | 'member';
  createdAt: string;
}

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

export function isValidOtpToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const trimmed = token.trim();
  return /^\d{6,8}$/.test(trimmed);
}
