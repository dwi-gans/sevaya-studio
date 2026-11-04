import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, supabaseAdmin, invalidateTokenCache } from '@/lib/auth-server';

export interface AddressItem {
  id: string;
  user_id: string;
  recipient_name: string;
  phone: string;
  address_line: string;
  city: string;
  province: string;
  postal_code: string;
  notes?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Helper to get addresses from user_metadata
function getMetadataAddresses(user: any): AddressItem[] {
  const meta = user.supabaseUser?.user_metadata || {};
  return Array.isArray(meta.addresses) ? meta.addresses : [];
}

// Helper to save addresses to user_metadata securely
async function saveMetadataAddresses(user: any, addresses: AddressItem[]) {
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...(user.supabaseUser?.user_metadata || {}),
      addresses,
    },
  });
  if (error) {
    console.error('[addresses] updateUserById error:', error);
    throw new Error(error.message || 'Gagal menyimpan alamat ke database akun');
  }
  // Invalidate token cache so GET immediately reflects new addresses!
  invalidateTokenCache();
  return data;
}

/**
 * GET /api/user/addresses
 * Returns user addresses from session metadata.
 */
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser(req);
    if (error || !user) {
      return NextResponse.json({ success: false, error: error || 'Tidak terautentikasi' }, { status: 401 });
    }

    const addresses = getMetadataAddresses(user);
    return NextResponse.json(
      { success: true, addresses },
      { headers: { 'Cache-Control': 'private, no-cache, no-store, must-revalidate' } }
    );
  } catch (err: unknown) {
    console.error('Get addresses error:', err);
    return NextResponse.json({ success: false, error: 'Gagal mengambil daftar alamat' }, { status: 500 });
  }
}

/**
 * POST /api/user/addresses
 * Adds a new address to user profile
 */
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser(req);
    if (error || !user) {
      return NextResponse.json({ success: false, error: error || 'Tidak terautentikasi' }, { status: 401 });
    }

    const body = await req.json();
    const { recipient_name, phone, address_line, city, province, postal_code, notes, is_default } = body;

    if (!recipient_name?.trim() || !phone?.trim() || !address_line?.trim() || !city?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Harap lengkapi nama penerima, nomor telepon, alamat, dan kota.' },
        { status: 400 }
      );
    }

    const newId = `addr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newAddress: AddressItem = {
      id: newId,
      user_id: user.id,
      recipient_name: recipient_name.trim(),
      phone: phone.trim(),
      address_line: address_line.trim(),
      city: city.trim(),
      province: (province && province.trim()) || 'DKI Jakarta',
      postal_code: (postal_code && postal_code.trim()) || '10110',
      notes: notes?.trim() || '',
      is_default: Boolean(is_default),
      created_at: now,
      updated_at: now,
    };

    const currentList = getMetadataAddresses(user);
    const updatedList = newAddress.is_default
      ? currentList.map((a) => ({ ...a, is_default: false }))
      : [...currentList];
    updatedList.unshift(newAddress);

    await saveMetadataAddresses(user, updatedList);

    return NextResponse.json({
      success: true,
      message: 'Alamat berhasil ditambahkan.',
      address: newAddress,
      addresses: updatedList,
    });
  } catch (err: unknown) {
    console.error('Create address error:', err);
    const msg = err instanceof Error ? err.message : 'Gagal menambahkan alamat baru.';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * PUT /api/user/addresses
 * Updates an existing address
 */
export async function PUT(req: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser(req);
    if (error || !user) {
      return NextResponse.json({ success: false, error: error || 'Tidak terautentikasi' }, { status: 401 });
    }

    const body = await req.json();
    const id = body.id || req.nextUrl.searchParams.get('id');
    const { recipient_name, phone, address_line, city, province, postal_code, notes, is_default } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID alamat tidak ditemukan.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const currentList = getMetadataAddresses(user);

    const updatedList = currentList.map((a) => {
      if (a.id === id) {
        return {
          ...a,
          recipient_name: recipient_name?.trim() || a.recipient_name,
          phone: phone?.trim() || a.phone,
          address_line: address_line?.trim() || a.address_line,
          city: city?.trim() || a.city,
          province: province?.trim() || a.province || 'DKI Jakarta',
          postal_code: postal_code?.trim() || a.postal_code || '10110',
          notes: notes !== undefined ? notes.trim() : a.notes,
          is_default: is_default !== undefined ? Boolean(is_default) : a.is_default,
          updated_at: now,
        };
      }
      return is_default ? { ...a, is_default: false } : a;
    });

    await saveMetadataAddresses(user, updatedList);

    return NextResponse.json({
      success: true,
      message: 'Alamat berhasil diperbarui.',
      addresses: updatedList,
    });
  } catch (err: unknown) {
    console.error('Update address error:', err);
    const msg = err instanceof Error ? err.message : 'Gagal memperbarui alamat.';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * DELETE /api/user/addresses
 * Deletes an address from user profile
 */
export async function DELETE(req: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser(req);
    if (error || !user) {
      return NextResponse.json({ success: false, error: error || 'Tidak terautentikasi' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID alamat diperlukan.' }, { status: 400 });
    }

    const currentList = getMetadataAddresses(user);
    const updatedList = currentList.filter((a) => a.id !== id);

    await saveMetadataAddresses(user, updatedList);

    return NextResponse.json({
      success: true,
      message: 'Alamat berhasil dihapus.',
      addresses: updatedList,
    });
  } catch (err: unknown) {
    console.error('Delete address error:', err);
    const msg = err instanceof Error ? err.message : 'Gagal menghapus alamat.';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
