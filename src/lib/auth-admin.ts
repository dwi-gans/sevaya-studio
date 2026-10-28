import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const ADMIN_COOKIE_NAME = 'sevaya_admin_token';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'sevayaStudio1!';
const ADMIN_SECRET =
  process.env.ADMIN_JWT_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'sevaya_admin_secret_signing_key_secure_2026';

export interface AdminSession {
  username: string;
  issuedAt: number;
  expiresAt: number;
}

/**
 * Sign payload using HMAC SHA-256
 */
function signToken(data: string): string {
  const hmac = crypto.createHmac('sha256', ADMIN_SECRET);
  hmac.update(data);
  return hmac.digest('hex');
}

/**
 * Create a signed admin token string
 */
export function generateAdminToken(username: string): string {
  const now = Date.now();
  const session: AdminSession = {
    username,
    issuedAt: now,
    expiresAt: now + 24 * 60 * 60 * 1000, // 24 hours
  };
  const jsonStr = JSON.stringify(session);
  const base64Data = Buffer.from(jsonStr).toString('base64url');
  const signature = signToken(base64Data);
  return `${base64Data}.${signature}`;
}

/**
 * Verify signed admin token and ensure it has not expired
 */
export function verifyAdminToken(token: string | null | undefined): AdminSession | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [base64Data, signature] = parts;
  if (!base64Data || !signature) return null;

  const expectedSignature = signToken(base64Data);
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(base64Data, 'base64url').toString('utf8');
    const session: AdminSession = JSON.parse(jsonStr);

    if (Date.now() > session.expiresAt) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Validates request carries a valid admin session cookie or Authorization header
 */
export function verifyAdminSession(req: NextRequest): AdminSession | null {
  // 1. Check HTTP-Only Cookie
  const tokenFromCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (tokenFromCookie) {
    const session = verifyAdminToken(tokenFromCookie);
    if (session) return session;
  }

  // 2. Check Authorization Bearer header
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.substring(7).trim();
    const session = verifyAdminToken(bearerToken);
    if (session) return session;
  }

  return null;
}

/**
 * Validates username and password using timing-safe comparison
 */
export function checkAdminCredentials(user: string, pass: string): boolean {
  const userMatch = crypto.timingSafeEqual(
    Buffer.from(user.padEnd(64).slice(0, 64)),
    Buffer.from(ADMIN_USERNAME.padEnd(64).slice(0, 64))
  ) && user === ADMIN_USERNAME;

  const passMatch = crypto.timingSafeEqual(
    Buffer.from(pass.padEnd(64).slice(0, 64)),
    Buffer.from(ADMIN_PASSWORD.padEnd(64).slice(0, 64))
  ) && pass === ADMIN_PASSWORD;

  return userMatch && passMatch;
}

/**
 * Attach the secure HttpOnly cookie to a response
 */
export function attachAdminCookie(res: NextResponse, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60, // 24 hours
  });
}

/**
 * Remove the admin session cookie on logout
 */
export function clearAdminCookie(res: NextResponse): void {
  res.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
