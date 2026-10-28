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

    // Try reading from public.profiles table
    let profileData: any = null;
    try {
      const { data, error: pErr } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!pErr && data) {
        profileData = data;
      }
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: user.id,
        email: user.email,
        fullName: profileData?.full_name || user.name,
        phone: profileData?.phone || user.phone || '',
        avatarUrl: profileData?.avatar_url || user.avatar_url || '',
        createdAt: user.created_at,
        updatedAt: profileData?.updated_at || user.created_at,
      },
    });
  } catch (err: unknown) {
    console.error('Get profile error:', err);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data profil' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser(req);

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { fullName, phone, avatarUrl } = body;

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Nama lengkap wajib diisi minimal 2 karakter.' },
        { status: 400 }
      );
    }

    const cleanName = fullName.trim();
    const cleanPhone = phone ? String(phone).replace(/[^\d+]/g, '').trim() : '';
    const cleanAvatar = avatarUrl && typeof avatarUrl === 'string' ? avatarUrl.trim() : '';

    // 1. Update user_metadata in Supabase Auth
    const { error: metaErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.supabaseUser.user_metadata,
        name: cleanName,
        full_name: cleanName,
        phone: cleanPhone,
        avatar_url: cleanAvatar,
      },
    });

    if (metaErr) {
      console.warn('Update user_metadata warning:', metaErr);
    }

    // 2. Upsert to public.profiles table
    try {
      await supabaseAdmin.from('profiles').upsert({
        id: user.id,
        full_name: cleanName,
        phone: cleanPhone,
        avatar_url: cleanAvatar,
        updated_at: new Date().toISOString(),
      });
    } catch (profileErr) {
      console.warn('Profiles table upsert notice:', profileErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Profil berhasil diperbarui.',
      profile: {
        id: user.id,
        email: user.email,
        fullName: cleanName,
        phone: cleanPhone,
        avatarUrl: cleanAvatar,
      },
    });
  } catch (err: unknown) {
    console.error('Update profile error:', err);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui profil pengguna.' },
      { status: 500 }
    );
  }
}
