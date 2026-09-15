import crypto from "crypto";

export const ADMIN_SESSION_COOKIE_NAME = "vasuki_admin_session";
export const SESSION_DURATION_SECONDS = 8 * 60 * 60; // 8 hours

/**
 * Constant-time string comparison to prevent timing attacks.
 */
export function timingSafeCompare(a: string | null | undefined, b: string | null | undefined): boolean {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

export interface AdminSessionPayload {
  authenticated: true;
  issued_at: number;
  expires_at: number;
  nonce: string;
}

// -----------------------------------------------------------------------------
// In-Memory Login Rate Limiter (Brute-force protection without Redis)
// -----------------------------------------------------------------------------
interface RateLimitEntry {
  attempts: number;
  firstAttemptTime: number;
  blockedUntil: number;
}

const MAX_LOGIN_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes cooldown

const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Checks if an IP is currently rate-limited from making login attempts.
 */
export function checkLoginRateLimit(ip: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((entry.blockedUntil - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  // Reset window if expired
  if (now - entry.firstAttemptTime > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.delete(ip);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Records a failed login attempt for an IP.
 */
export function recordFailedLogin(ip: string): { blocked: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || {
    attempts: 0,
    firstAttemptTime: now,
    blockedUntil: 0,
  };

  entry.attempts += 1;

  if (entry.attempts >= MAX_LOGIN_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_DURATION_MS;
    rateLimitMap.set(ip, entry);
    const retryAfterSeconds = Math.ceil(BLOCK_DURATION_MS / 1000);
    return { blocked: true, retryAfterSeconds };
  }

  rateLimitMap.set(ip, entry);
  return { blocked: false, retryAfterSeconds: 0 };
}

/**
 * Resets rate limit tracking on successful login.
 */
export function resetLoginAttempts(ip: string): void {
  rateLimitMap.delete(ip);
}

// -----------------------------------------------------------------------------
// HMAC-SHA256 Signed Session Management
// -----------------------------------------------------------------------------
function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    // In test/development environment, provide a deterministic fallback secret
    return "vasuki_default_development_session_secret_change_in_production_32b";
  }
  return secret;
}

function getExpectedAdminToken(): string {
  return process.env.ADMIN_ACCESS_TOKEN || "";
}

/**
 * Creates an HMAC-SHA256 signed session string from payload.
 * Format: `base64(payload).signatureHex`
 */
export function signSessionPayload(payload: AdminSessionPayload): string {
  const secret = getSessionSecret();
  const rawPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(rawPayload)
    .digest("hex");

  return `${rawPayload}.${signature}`;
}

/**
 * Verifies and decodes a signed session token.
 * Validates cryptographic signature and expiration time.
 */
export function verifySessionToken(tokenString?: string | null): AdminSessionPayload | null {
  if (!tokenString || typeof tokenString !== "string") return null;

  const parts = tokenString.split(".");
  if (parts.length !== 2) return null;

  const [rawPayload, signature] = parts;
  const secret = getSessionSecret();

  // Re-compute expected signature
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawPayload)
    .digest("hex");

  // Constant-time signature verification
  if (!timingSafeCompare(signature, expectedSignature)) {
    return null;
  }

  try {
    const payloadJson = Buffer.from(rawPayload, "base64url").toString("utf-8");
    const payload = JSON.parse(payloadJson) as AdminSessionPayload;

    if (!payload || !payload.authenticated) return null;

    // Check expiration
    if (Date.now() > payload.expires_at) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Validates a submitted raw access token against the server configuration.
 * Uses constant-time comparison to prevent timing side-channel attacks.
 */
export function validateAdminAccessToken(submittedToken: string): boolean {
  if (!submittedToken || typeof submittedToken !== "string") return false;
  const expectedToken = getExpectedAdminToken();
  if (!expectedToken) return false;

  return timingSafeCompare(submittedToken.trim(), expectedToken.trim());
}

/**
 * Creates a signed admin session token.
 */
export function createAdminSessionToken(): string {
  const now = Date.now();
  const payload: AdminSessionPayload = {
    authenticated: true,
    issued_at: now,
    expires_at: now + SESSION_DURATION_SECONDS * 1000,
    nonce: crypto.randomBytes(16).toString("hex"),
  };

  return signSessionPayload(payload);
}

/**
 * Verifies current admin session from Next.js request cookies.
 */
export async function verifyAdminSession(): Promise<boolean> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
    const session = verifySessionToken(sessionCookie);
    return Boolean(session && session.authenticated);
  } catch {
    return false;
  }
}

/**
 * Helper to set the secure HttpOnly session cookie on login.
 */
export async function setAdminSessionCookie(sessionToken: string): Promise<void> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";

  cookieStore.set({
    name: ADMIN_SESSION_COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

/**
 * Helper to clear the session cookie on logout.
 */
export async function clearAdminSessionCookie(): Promise<void> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE_NAME);
}

/**
 * Validates request Origin/Host headers to defend against Cross-Site Request Forgery.
 */
export async function validateRequestOrigin(): Promise<boolean> {
  try {
    const { headers } = await import("next/headers");
    const headerList = await headers();
    const origin = headerList.get("origin");
    const host = headerList.get("host");

    // If origin is not provided (e.g., standard same-origin navigation/GET), pass
    if (!origin) return true;

    const originUrl = new URL(origin);
    // Origin host must match Host header
    return originUrl.host === host;
  } catch {
    return false;
  }
}

/**
 * Safe server-side audit logger. Never logs credentials, tokens, or cookie values.
 */
export function logAdminOperation(operation: string, details?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  console.log(`[VasukiPublication Admin Audit] ${timestamp} — ${operation}`, details ? details : "");
}
