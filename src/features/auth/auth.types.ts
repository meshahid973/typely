export type AuthStatus = "disabled" | "checking" | "guest" | "authenticated";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterDetails extends AuthCredentials {
  displayName: string;
}

export interface CloudBackupRecord {
  payload: unknown | null;
  updatedAt: string | null;
}
