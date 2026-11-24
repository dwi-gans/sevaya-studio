/**
 * proxy.ts  (renamed from middleware.ts per Next.js 16 convention)
 *
 * Anti-brute-force rate limiting untuk semua API route.
 * Menggunakan sliding-window in-memory rate limiter per IP.
 *
 * Tier batas request:
 * ┌──────────────────────────────┬──────────┬────────────┐
 * │ Bucket                       │ Limit    │ Window     │
 * ├──────────────────────────────┼──────────┼────────────┤
 * │ admin-auth (login admin)     │  5 req   │ 15 menit   │
 * │ auth (user login/signup)     │ 10 req   │ 10 menit   │
 * │ payment/checkout             │  5 req   │ 10 menit   │
 * │ admin-write (POST/PUT/DELETE)│ 60 req   │  1 menit   │
 * │ upload (file upload)         │ 10 req   │  1 menit   │
 * │ api-global (semua API)       │120 req   │  1 menit   │
 * └──────────────────────────────┴──────────┴────────────┘
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';

// Ambil IP dari header (support proxy/CDN)
function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '127.0.0.1'
  );
}

function rateLimitResponse(retryAfterMs: number, message: string) {
  return Response.json(
    { error: message, retryAfter: Math.ceil(retryAfterMs / 1000) },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil(retryAfterMs / 1000)),
        'Content-Type': 'application/json',
      },
    }
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const ip = getIP(request);

  // ─── 1. Auth user (Supabase / sign-in / sign-up) ─────────────────────────
  if (pathname.startsWith('/api/auth')) {
    const r = rateLimit(ip, 'auth', 10, 10 * 60_000); // 10 req / 10 menit
    if (!r.ok) {
      return rateLimitResponse(
        r.retryAfterMs,
        'Terlalu banyak percobaan autentikasi. Tunggu sebentar.'
      );
    }
    const res = NextResponse.next();
    Object.entries(r.headers).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  // ─── 3. Payment & Checkout — cegah spam order ────────────────────────────
  if (pathname.startsWith('/api/payment') || pathname.startsWith('/api/orders')) {
    if (method === 'POST') {
      const r = rateLimit(ip, 'payment', 5, 10 * 60_000); // 5 order / 10 menit
      if (!r.ok) {
        return rateLimitResponse(
          r.retryAfterMs,
          'Terlalu banyak permintaan order. Tunggu beberapa menit.'
        );
      }
      const res = NextResponse.next();
      Object.entries(r.headers).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }
  }

  // ─── 4. Admin write operations (POST/PUT/DELETE) ──────────────────────────
  if (pathname.startsWith('/api/admin') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const r = rateLimit(ip, 'admin-write', 60, 60_000); // 60 req / 1 menit
    if (!r.ok) {
      return rateLimitResponse(r.retryAfterMs, 'Rate limit exceeded. Slow down.');
    }
    const res = NextResponse.next();
    Object.entries(r.headers).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  // ─── 5. File Upload — cegah server flood ─────────────────────────────────
  if (pathname.startsWith('/api/admin/upload')) {
    const r = rateLimit(ip, 'upload', 10, 60_000); // 10 upload / 1 menit
    if (!r.ok) {
      return rateLimitResponse(r.retryAfterMs, 'Upload terlalu sering. Tunggu sebentar.');
    }
    const res = NextResponse.next();
    Object.entries(r.headers).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  // ─── 6. Global API rate limit — semua /api/* ─────────────────────────────
  if (pathname.startsWith('/api/')) {
    const r = rateLimit(ip, 'api-global', 120, 60_000); // 120 req / 1 menit
    if (!r.ok) {
      return rateLimitResponse(r.retryAfterMs, 'Too many requests. Please slow down.');
    }
    const res = NextResponse.next();
    Object.entries(r.headers).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Hanya jalankan proxy untuk API routes
    '/api/:path*',
  ],
};
