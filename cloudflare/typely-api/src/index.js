const encoder = new TextEncoder();
const passwordIterations = 100000;
const maximumJsonBytes = 600000;

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    password_iterations INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  "CREATE INDEX IF NOT EXISTS sessions_user_id_index ON sessions(user_id)",
  "CREATE INDEX IF NOT EXISTS sessions_expires_at_index ON sessions(expires_at)",
  `CREATE TABLE IF NOT EXISTS user_sync (
    user_id TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS auth_rate_limits (
    bucket TEXT PRIMARY KEY,
    attempts INTEGER NOT NULL,
    window_started_at INTEGER NOT NULL
  )`,
];

let schemaPromise = null;

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");

  if (!origin) {
    return {};
  }

  const origins = allowedOrigins(env);

  if (!origins.includes(origin)) {
    throw new HttpError(403, "origin_not_allowed", "This app origin is not allowed.");
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function responseHeaders(request, env) {
  return {
    ...corsHeaders(request, env),
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  };
}

function json(request, env, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders(request, env),
  });
}

function errorJson(request, env, body, status) {
  let headers;

  try {
    headers = responseHeaders(request, env);
  } catch {
    headers = {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    };
  }

  return new Response(JSON.stringify(body), { status, headers });
}

function base64Url(bytes) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function fromBase64Url(value) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function randomToken(byteLength) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return base64Url(new Uint8Array(digest));
}

async function hashPassword(password, salt, pepper, iterations) {
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(`${password}\u0000${pepper}`),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations,
    },
    passwordKey,
    256,
  );
  return base64Url(new Uint8Array(bits));
}

function secureEqual(first, second) {
  const firstBytes = fromBase64Url(first);
  const secondBytes = fromBase64Url(second);

  if (firstBytes.length !== secondBytes.length) {
    return false;
  }

  let difference = 0;

  for (let index = 0; index < firstBytes.length; index += 1) {
    difference |= firstBytes[index] ^ secondBytes[index];
  }

  return difference === 0;
}

function normalizeEmail(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizeDisplayName(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/gu, " ")
    .slice(0, 24);
}

function validateEmail(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email);
}

function validatePassword(password) {
  return typeof password === "string" && password.length >= 10 && password.length <= 128;
}

async function readJson(request) {
  const contentLength = Number(request.headers.get("Content-Length") ?? 0);

  if (contentLength > maximumJsonBytes) {
    throw new HttpError(413, "payload_too_large", "The request is too large.");
  }

  const text = await request.text();

  if (encoder.encode(text).byteLength > maximumJsonBytes) {
    throw new HttpError(413, "payload_too_large", "The request is too large.");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "invalid_json", "The request body must be valid JSON.");
  }
}

function requireSecrets(env) {
  if (!env.PASSWORD_PEPPER || !env.RATE_LIMIT_SECRET) {
    throw new HttpError(503, "server_not_configured", "The account server is not configured.");
  }
}

async function ensureSchema(env) {
  if (!schemaPromise) {
    schemaPromise = env.DB.batch(
      schemaStatements.map((statement) => env.DB.prepare(statement)),
    ).catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }

  await schemaPromise;
}

function describeInternalError(caught) {
  const error = caught instanceof Error ? caught : null;
  const cause = error?.cause instanceof Error ? error.cause : null;
  const details = `${error?.message ?? ""} ${cause?.message ?? ""}`.trim();

  if (/no such table|d1_(?:exec_)?error|database/i.test(details)) {
    return new HttpError(
      503,
      "database_not_ready",
      "The account database was not ready and has been repaired. Try creating the account again.",
    );
  }

  if (/pbkdf2|derivebits|operationerror/i.test(details)) {
    return new HttpError(
      503,
      "password_service_unavailable",
      "The password service could not finish the request.",
    );
  }

  return new HttpError(500, "internal_error", "The account server could not complete the request.");
}

function logInternalError(request, caught, requestId) {
  const error = caught instanceof Error ? caught : null;
  const cause = error?.cause instanceof Error ? error.cause : null;
  const url = new URL(request.url);

  console.error("typely_api_error", {
    requestId,
    method: request.method,
    path: url.pathname,
    name: error?.name ?? typeof caught,
    message: error?.message ?? String(caught),
    cause: cause?.message ?? null,
  });
}

function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at,
  };
}

async function rateLimit(env, request, action, identity, limit = 10, windowSeconds = 900) {
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const bucket = await sha256(`${env.RATE_LIMIT_SECRET}:${action}:${ip}:${identity}`);
  const now = Date.now();
  const row = await env.DB.prepare(
    "SELECT attempts, window_started_at FROM auth_rate_limits WHERE bucket = ?1 LIMIT 1",
  )
    .bind(bucket)
    .first();

  if (!row || now - Number(row.window_started_at) >= windowSeconds * 1000) {
    await env.DB.prepare(
      "INSERT INTO auth_rate_limits (bucket, attempts, window_started_at) VALUES (?1, 1, ?2) ON CONFLICT(bucket) DO UPDATE SET attempts = 1, window_started_at = excluded.window_started_at",
    )
      .bind(bucket, now)
      .run();
    return;
  }

  if (Number(row.attempts) >= limit) {
    throw new HttpError(429, "too_many_attempts", "Too many attempts. Try again later.");
  }

  await env.DB.prepare("UPDATE auth_rate_limits SET attempts = attempts + 1 WHERE bucket = ?1")
    .bind(bucket)
    .run();
}

async function createSession(env, userId) {
  const token = randomToken(32);
  const tokenHash = await sha256(token);
  const now = new Date();
  const sessionDays = Math.max(1, Math.min(90, Number(env.SESSION_DAYS ?? 30)));
  const expiresAt = new Date(now.getTime() + sessionDays * 86400000);

  await env.DB.prepare(
    "INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)",
  )
    .bind(tokenHash, userId, now.toISOString(), expiresAt.toISOString())
    .run();

  return token;
}

async function requireUser(env, request) {
  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";

  if (!token) {
    throw new HttpError(401, "not_authenticated", "Sign in to continue.");
  }

  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(
    "SELECT users.id, users.email, users.display_name, users.created_at, sessions.expires_at FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ?1 LIMIT 1",
  )
    .bind(tokenHash)
    .first();

  if (!row || Date.parse(row.expires_at) <= Date.now()) {
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?1").bind(tokenHash).run();
    throw new HttpError(401, "session_expired", "Your session expired. Sign in again.");
  }

  return { user: row, tokenHash };
}

async function register(request, env) {
  const body = await readJson(request);

  if (typeof body !== "object" || body === null) {
    throw new HttpError(400, "invalid_body", "The request body must be a JSON object.");
  }
  const email = normalizeEmail(body.email);
  const displayName = normalizeDisplayName(body.displayName);
  const password = body.password;

  if (!validateEmail(email)) {
    throw new HttpError(400, "invalid_email", "Enter a valid email address.");
  }

  if (!displayName) {
    throw new HttpError(400, "invalid_display_name", "Enter a display name.");
  }

  if (!validatePassword(password)) {
    throw new HttpError(400, "weak_password", "Use a password between 10 and 128 characters.");
  }

  await rateLimit(env, request, "register", email, 6, 1800);

  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?1 LIMIT 1")
    .bind(email)
    .first();

  if (existing) {
    throw new HttpError(409, "email_in_use", "An account already uses this email address.");
  }

  const userId = crypto.randomUUID();
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const passwordHash = await hashPassword(password, salt, env.PASSWORD_PEPPER, passwordIterations);
  const now = new Date().toISOString();

  try {
    await env.DB.prepare(
      "INSERT INTO users (id, email, display_name, password_hash, password_salt, password_iterations, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7)",
    )
      .bind(userId, email, displayName, passwordHash, base64Url(salt), passwordIterations, now)
      .run();
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "";

    if (message.includes("UNIQUE constraint failed")) {
      throw new HttpError(409, "email_in_use", "An account already uses this email address.");
    }

    throw caught;
  }

  const token = await createSession(env, userId);
  return json(
    request,
    env,
    {
      user: { id: userId, email, displayName, createdAt: now },
      token,
    },
    201,
  );
}

async function login(request, env) {
  const body = await readJson(request);

  if (typeof body !== "object" || body === null) {
    throw new HttpError(400, "invalid_body", "The request body must be a JSON object.");
  }
  const email = normalizeEmail(body.email);
  const password = body.password;

  if (!validateEmail(email) || typeof password !== "string") {
    throw new HttpError(401, "invalid_credentials", "The email or password is incorrect.");
  }

  await rateLimit(env, request, "login", email, 10, 900);

  const row = await env.DB.prepare(
    "SELECT id, email, display_name, password_hash, password_salt, password_iterations, created_at FROM users WHERE email = ?1 LIMIT 1",
  )
    .bind(email)
    .first();

  const fallbackSalt = encoder.encode("typely-login-fallback-salt").slice(0, 16);
  const candidateHash = await hashPassword(
    password,
    row ? fromBase64Url(row.password_salt) : fallbackSalt,
    env.PASSWORD_PEPPER,
    row ? Number(row.password_iterations) : passwordIterations,
  );

  if (!row || !secureEqual(candidateHash, row.password_hash)) {
    throw new HttpError(401, "invalid_credentials", "The email or password is incorrect.");
  }

  const token = await createSession(env, row.id);
  return json(request, env, { user: publicUser(row), token });
}

async function me(request, env) {
  const session = await requireUser(env, request);
  return json(request, env, { user: publicUser(session.user) });
}

async function logout(request, env) {
  const session = await requireUser(env, request);
  await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?1").bind(session.tokenHash).run();
  return json(request, env, { loggedOut: true });
}

async function updateAccount(request, env) {
  const session = await requireUser(env, request);
  const body = await readJson(request);

  if (typeof body !== "object" || body === null) {
    throw new HttpError(400, "invalid_body", "The request body must be a JSON object.");
  }

  const displayName = normalizeDisplayName(body.displayName);

  if (!displayName) {
    throw new HttpError(400, "invalid_display_name", "Enter a display name.");
  }

  const updatedAt = new Date().toISOString();
  await env.DB.prepare("UPDATE users SET display_name = ?1, updated_at = ?2 WHERE id = ?3")
    .bind(displayName, updatedAt, session.user.id)
    .run();

  return json(request, env, {
    user: {
      ...publicUser(session.user),
      displayName,
    },
  });
}

async function getSync(request, env) {
  const session = await requireUser(env, request);
  const row = await env.DB.prepare(
    "SELECT payload, updated_at FROM user_sync WHERE user_id = ?1 LIMIT 1",
  )
    .bind(session.user.id)
    .first();

  let payload = null;

  if (row) {
    try {
      payload = JSON.parse(row.payload);
    } catch {
      throw new HttpError(500, "invalid_cloud_backup", "The stored cloud backup is invalid.");
    }
  }

  return json(request, env, {
    payload,
    updatedAt: row?.updated_at ?? null,
  });
}

async function putSync(request, env) {
  const session = await requireUser(env, request);
  const body = await readJson(request);

  if (typeof body !== "object" || body === null || !("payload" in body)) {
    throw new HttpError(400, "invalid_backup", "A Typely backup payload is required.");
  }

  const payload = JSON.stringify(body.payload);

  if (encoder.encode(payload).byteLength > maximumJsonBytes) {
    throw new HttpError(413, "backup_too_large", "The cloud backup is too large.");
  }

  const updatedAt = new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO user_sync (user_id, payload, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT(user_id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at",
  )
    .bind(session.user.id, payload, updatedAt)
    .run();

  return json(request, env, { updatedAt });
}

async function route(request, env) {
  requireSecrets(env);
  await ensureSchema(env);
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/u, "") || "/";

  if (request.method === "POST" && path === "/v1/auth/register") {
    return register(request, env);
  }

  if (request.method === "POST" && path === "/v1/auth/login") {
    return login(request, env);
  }

  if (request.method === "GET" && path === "/v1/auth/me") {
    return me(request, env);
  }

  if (request.method === "POST" && path === "/v1/auth/logout") {
    return logout(request, env);
  }

  if (request.method === "PATCH" && path === "/v1/account") {
    return updateAccount(request, env);
  }

  if (request.method === "GET" && path === "/v1/sync") {
    return getSync(request, env);
  }

  if (request.method === "PUT" && path === "/v1/sync") {
    return putSync(request, env);
  }

  throw new HttpError(404, "not_found", "The requested endpoint does not exist.");
}

export default {
  async fetch(request, env, context) {
    try {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: corsHeaders(request, env),
        });
      }

      const url = new URL(request.url);

      if (request.method === "GET" && url.pathname === "/health") {
        requireSecrets(env);
        await ensureSchema(env);
        await env.DB.prepare("SELECT 1 AS ready").first();

        return json(request, env, {
          ok: true,
          service: "typely-api",
          database: "ready",
          secrets: "ready",
          passwordIterations,
        });
      }

      if (Math.random() < 0.02) {
        context.waitUntil(
          env.DB.batch([
            env.DB.prepare("DELETE FROM sessions WHERE expires_at <= ?1").bind(
              new Date().toISOString(),
            ),
            env.DB.prepare("DELETE FROM auth_rate_limits WHERE window_started_at < ?1").bind(
              Date.now() - 86400000,
            ),
          ]),
        );
      }

      return await route(request, env);
    } catch (caught) {
      const requestId = crypto.randomUUID();
      const isExpected = caught instanceof HttpError;
      const error = isExpected ? caught : describeInternalError(caught);

      if (!isExpected) {
        logInternalError(request, caught, requestId);
      }

      return errorJson(
        request,
        env,
        {
          error: {
            code: error.code,
            message: isExpected ? error.message : `${error.message} Reference ${requestId}.`,
            requestId,
          },
        },
        error.status,
      );
    }
  },
};
