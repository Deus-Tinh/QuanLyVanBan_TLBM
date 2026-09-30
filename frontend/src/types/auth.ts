export type AuthRole = 'admin' | 'staff';

export interface UserSession {
  username: string;
  fullName: string;
  role: AuthRole;
  roleTitle: string;
  avatar?: string;
  token?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface QuickLoginProfile {
  role: AuthRole;
  label: string;
  username: string;
  password: string;
  subtitle: string;
}

