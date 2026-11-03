import { NextRequest } from 'next/server';
import { createClient, User as SupabaseUser } from '@supabase/supabase-js';

// Server-side privileged Supabase client with Service Role Key
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  supabaseUser: SupabaseUser;
}

// In-memory token verification cache to eliminate remote Supabase Auth network latency
// on frequent authenticated requests (120 seconds TTL — safe since Supabase JWTs valid 1h)
interface TokenCacheEntry {
  user: AuthenticatedUser;
  expiresAt: number;
}
const tokenVerificationCache = new Map<string, TokenCacheEntry>();

export function invalidateTokenCache(token?: string) {
  if (token) {
    tokenVerificationCache.delete(token);
  } else {
    tokenVerificationCache.clear();
  }
}

/**
 * Extracts and cryptographically verifies the bearer token from the incoming request.
 * NEVER trusts client-supplied user IDs.
 * Uses a short-lived in-memory cache to prevent redundant remote network round-trips.
 */
export async function getAuthenticatedUser(
  req: NextRequest
): Promise<{ user: AuthenticatedUser | null; error: string | null }> {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    let token: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    // Also check for supabase auth cookie if token not present in header
    if (!token) {
      const cookies = req.cookies;
      // standard supabase cookie names
      const tokenCookie =
        cookies.get('sb-access-token')?.value ||
        cookies.get('supabase-auth-token')?.value;

      if (tokenCookie) {
        try {
          // might be stringified json or raw token
          if (tokenCookie.startsWith('[')) {
            const parsed = JSON.parse(tokenCookie);
            token = parsed[0];
          } else {
            token = tokenCookie;
          }
        } catch {
          token = tokenCookie;
        }
      }
    }

    if (!token) {
      return { user: null, error: 'Token autentikasi tidak ditemukan. Harap login terlebih dahulu.' };
    }

    // 1. Check in-memory verification cache
    const now = Date.now();
    const cached = tokenVerificationCache.get(token);
    if (cached && cached.expiresAt > now) {
      return { user: cached.user, error: null };
    }

    // 2. Verify token cryptographically with Supabase Auth server
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      tokenVerificationCache.delete(token);
      return { user: null, error: 'Sesi tidak valid atau telah kedaluwarsa. Harap login kembali.' };
    }

    const sbUser = data.user;
    const meta = sbUser.user_metadata || {};

    const authenticatedUser: AuthenticatedUser = {
      id: sbUser.id,
      email: sbUser.email || '',
      name:
        meta.full_name ||
        meta.name ||
        sbUser.email?.split('@')[0] ||
        'Member Sevaya',
      phone: meta.phone || sbUser.phone || '',
      avatar_url: meta.avatar_url || '',
      created_at: sbUser.created_at,
      supabaseUser: sbUser,
    };

    // Store in cache (120 seconds TTL — Supabase JWTs are valid for 1 hour)
    tokenVerificationCache.set(token, {
      user: authenticatedUser,
      expiresAt: now + 120 * 1000,
    });

    // Clean up expired cache entries if cache grows
    if (tokenVerificationCache.size > 200) {
      for (const [key, entry] of tokenVerificationCache.entries()) {
        if (entry.expiresAt <= now) tokenVerificationCache.delete(key);
      }
    }

    return { user: authenticatedUser, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Kesalahan verifikasi autentikasi server';
    return { user: null, error: msg };
  }
}
