import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, supabaseAdmin } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser(req);

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    // Attempt to read from public.profiles table
    let profileData: { full_name?: string; phone?: string; avatar_url?: string } | null = null;
    try {
      const { data, error: pErr } = await supabaseAdmin
        .from('profiles')
        .select('full_name, phone, avatar_url, updated_at')
        .eq('id', user.id)
        .maybeSingle();

      if (!pErr && data) {
        profileData = data;
      }
    } catch {
      // profiles table might not exist yet
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: profileData?.full_name || user.name,
        phone: profileData?.phone || user.phone,
        avatar_url: profileData?.avatar_url || user.avatar_url,
        created_at: user.created_at,
      },
    });
  } catch (err: unknown) {
    console.error('Auth ME API error:', err);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data pengguna.' },
      { status: 500 }
    );
  }
}
