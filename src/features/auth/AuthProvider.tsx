import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getCloudBackup,
  getCurrentAccount,
  isAuthApiConfigured,
  loginAccount,
  logoutAccount,
  readStoredAuthToken,
  registerAccount,
  saveCloudBackup,
  storeAuthToken,
  updateCloudAccount,
} from "../../api/authClient";
import type {
  AuthCredentials,
  AuthStatus,
  AuthUser,
  CloudBackupRecord,
  RegisterDetails,
} from "./auth.types";

interface AuthContextValue {
  configured: boolean;
  status: AuthStatus;
  user: AuthUser | null;
  error: string | null;
  clearError: () => void;
  login: (credentials: AuthCredentials) => Promise<AuthUser>;
  register: (details: RegisterDetails) => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateAccount: (displayName: string) => Promise<AuthUser>;
  loadCloudBackup: () => Promise<CloudBackupRecord>;
  uploadCloudBackup: (payload: unknown) => Promise<string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const configured = isAuthApiConfigured();
  const [token, setToken] = useState<string | null>(() => readStoredAuthToken());
  const [status, setStatus] = useState<AuthStatus>(configured ? "checking" : "disabled");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const saveSession = useCallback((nextToken: string, nextUser: AuthUser) => {
    storeAuthToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
    setStatus("authenticated");
    setError(null);
  }, []);

  const clearSession = useCallback(() => {
    storeAuthToken(null);
    setToken(null);
    setUser(null);
    setStatus(configured ? "guest" : "disabled");
  }, [configured]);

  useEffect(() => {
    if (!configured) {
      setStatus("disabled");
      return;
    }

    if (!token) {
      setStatus("guest");
      return;
    }

    const controller = new AbortController();
    setStatus("checking");

    void getCurrentAccount(token, controller.signal)
      .then((response) => {
        setUser(response.user);
        setStatus("authenticated");
        setError(null);
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        clearSession();
        setError(caught instanceof Error ? caught.message : "Your session could not be restored.");
      });

    return () => controller.abort();
  }, [clearSession, configured, token]);

  const login = useCallback(
    async (credentials: AuthCredentials) => {
      setStatus("checking");
      setError(null);

      try {
        const response = await loginAccount(credentials);
        saveSession(response.token, response.user);
        return response.user;
      } catch (caught) {
        setStatus("guest");
        const message = caught instanceof Error ? caught.message : "Sign in failed.";
        setError(message);
        throw caught;
      }
    },
    [saveSession],
  );

  const register = useCallback(
    async (details: RegisterDetails) => {
      setStatus("checking");
      setError(null);

      try {
        const response = await registerAccount(details);
        saveSession(response.token, response.user);
        return response.user;
      } catch (caught) {
        setStatus("guest");
        const message = caught instanceof Error ? caught.message : "Account creation failed.";
        setError(message);
        throw caught;
      }
    },
    [saveSession],
  );

  const logout = useCallback(async () => {
    const currentToken = token;
    clearSession();

    if (!currentToken) {
      return;
    }

    await logoutAccount(currentToken).catch(() => undefined);
  }, [clearSession, token]);

  const updateAccount = useCallback(
    async (displayName: string) => {
      if (!token) {
        throw new Error("Sign in before changing your cloud profile.");
      }

      const response = await updateCloudAccount(token, displayName);
      setUser(response.user);
      return response.user;
    },
    [token],
  );

  const loadCloudBackup = useCallback(async () => {
    if (!token) {
      throw new Error("Sign in before restoring cloud data.");
    }

    return getCloudBackup(token);
  }, [token]);

  const uploadCloudBackup = useCallback(
    async (payload: unknown) => {
      if (!token) {
        throw new Error("Sign in before syncing cloud data.");
      }

      const response = await saveCloudBackup(token, payload);
      return response.updatedAt;
    },
    [token],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      status,
      user,
      error,
      clearError: () => setError(null),
      login,
      register,
      logout,
      updateAccount,
      loadCloudBackup,
      uploadCloudBackup,
    }),
    [
      configured,
      status,
      user,
      error,
      login,
      register,
      logout,
      updateAccount,
      loadCloudBackup,
      uploadCloudBackup,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
