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

/**
 * Extracts and cryptographically verifies the bearer token from the incoming request.
 * NEVER trusts client-supplied user IDs.
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

    // Verify token cryptographically with Supabase Auth server
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
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

    return { user: authenticatedUser, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Kesalahan verifikasi autentikasi server';
    return { user: null, error: msg };
  }
}
