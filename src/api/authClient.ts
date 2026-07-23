import type {
  AuthCredentials,
  AuthUser,
  CloudBackupRecord,
  RegisterDetails,
} from "../features/auth/auth.types";

const tokenStorageKey = "typely.auth.token";
export const defaultAuthApiBaseUrl = "https://typely-api.coderpixelbusiness.workers.dev";

export function resolveAuthApiBaseUrl(value?: string) {
  const configured = (value ?? "").trim().replace(/\/+$/, "");
  return configured || defaultAuthApiBaseUrl;
}

const apiBaseUrl = resolveAuthApiBaseUrl(import.meta.env.VITE_TYPELY_API_URL);

interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
  };
}

interface SessionResponse {
  user: AuthUser;
  token: string;
}

export class AuthApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code = "request_failed", status = 0) {
    super(message);
    this.name = "AuthApiError";
    this.code = code;
    this.status = status;
  }
}

export function isAuthApiConfigured() {
  return apiBaseUrl.length > 0;
}

export function getAuthApiBaseUrl() {
  return apiBaseUrl;
}

export function readStoredAuthToken() {
  try {
    return window.localStorage.getItem(tokenStorageKey);
  } catch {
    return null;
  }
}

export function storeAuthToken(token: string | null) {
  try {
    if (token) {
      window.localStorage.setItem(tokenStorageKey, token);
    } else {
      window.localStorage.removeItem(tokenStorageKey);
    }
  } catch {
    return;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new AuthApiError(
      "Typely could not reach the account server. Check your connection and try again.",
      "network_error",
    );
  }

  const body = (await response.json().catch(() => null)) as (T & ApiErrorBody) | null;

  if (!response.ok) {
    const message = body?.error?.message ?? "The account server rejected this request.";
    const code = body?.error?.code ?? "request_failed";
    throw new AuthApiError(message, code, response.status);
  }

  if (body === null) {
    throw new AuthApiError("The account server returned an invalid response.", "invalid_response");
  }

  return body;
}

export function registerAccount(details: RegisterDetails) {
  return request<SessionResponse>("/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(details),
  });
}

export function loginAccount(credentials: AuthCredentials) {
  return request<SessionResponse>("/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function getCurrentAccount(token: string, signal?: AbortSignal) {
  return request<{ user: AuthUser }>(
    "/v1/auth/me",
    {
      method: "GET",
      signal,
    },
    token,
  );
}

export function logoutAccount(token: string) {
  return request<{ loggedOut: boolean }>(
    "/v1/auth/logout",
    {
      method: "POST",
    },
    token,
  );
}

export function updateCloudAccount(token: string, displayName: string) {
  return request<{ user: AuthUser }>(
    "/v1/account",
    {
      method: "PATCH",
      body: JSON.stringify({ displayName }),
    },
    token,
  );
}

export function getCloudBackup(token: string) {
  return request<CloudBackupRecord>("/v1/sync", { method: "GET" }, token);
}

export function saveCloudBackup(token: string, payload: unknown) {
  return request<{ updatedAt: string }>(
    "/v1/sync",
    {
      method: "PUT",
      body: JSON.stringify({ payload }),
    },
    token,
  );
}
