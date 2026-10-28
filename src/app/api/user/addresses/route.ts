import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, supabaseAdmin } from '@/lib/auth-server';

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

// Helper to get fallback addresses from metadata
function getMetadataAddresses(user: any): AddressItem[] {
  const meta = user.supabaseUser?.user_metadata || {};
  return Array.isArray(meta.addresses) ? meta.addresses : [];
}

// Helper to save fallback addresses to metadata
async function saveMetadataAddresses(user: any, addresses: AddressItem[]) {
  try {
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.supabaseUser.user_metadata,
        addresses,
      },
    });
  } catch (err) {
    console.warn('saveMetadataAddresses warning:', err);
  }
}

/**
 * GET /api/user/addresses
 */
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser(req);
    if (error || !user) {
      return NextResponse.json({ success: false, error: error || 'Tidak terautentikasi' }, { status: 401 });
    }

    // Try reading from public.addresses table
    try {
      const { data, error: aErr } = await supabaseAdmin
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (!aErr && data && data.length >= 0) {
        return NextResponse.json({ success: true, addresses: data });
      }
    } catch {
      // Table may not exist yet, fallback to user_metadata
    }

    const fallbackAddresses = getMetadataAddresses(user);
    return NextResponse.json({ success: true, addresses: fallbackAddresses });
  } catch (err: unknown) {
    console.error('Get addresses error:', err);
    return NextResponse.json({ success: false, error: 'Gagal mengambil daftar alamat' }, { status: 500 });
  }
}

/**
 * POST /api/user/addresses
 */
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser(req);
    if (error || !user) {
      return NextResponse.json({ success: false, error: error || 'Tidak terautentikasi' }, { status: 401 });
    }

    const body = await req.json();
    const { recipient_name, phone, address_line, city, province, postal_code, notes, is_default } = body;

    if (!recipient_name?.trim() || !phone?.trim() || !address_line?.trim() || !city?.trim() || !province?.trim() || !postal_code?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Semua kolom wajib alamat harus diisi lengkap.' },
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
      province: province.trim(),
      postal_code: postal_code.trim(),
      notes: notes?.trim() || '',
      is_default: Boolean(is_default),
      created_at: now,
      updated_at: now,
    };

    // Try DB first
    let dbSuccess = false;
    try {
      if (newAddress.is_default) {
        // unset other defaults for this user
        await supabaseAdmin.from('addresses').update({ is_default: false }).eq('user_id', user.id);
      }
      const { data, error: dbErr } = await supabaseAdmin.from('addresses').insert(newAddress).select().single();
      if (!dbErr && data) {
        dbSuccess = true;
      }
    } catch {
      // fallback
    }

    // Always keep metadata updated as reliable replica
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
    });
  } catch (err: unknown) {
    console.error('Create address error:', err);
    return NextResponse.json({ success: false, error: 'Gagal menambahkan alamat baru.' }, { status: 500 });
  }
}

/**
 * PUT /api/user/addresses
 */
export async function PUT(req: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser(req);
    if (error || !user) {
      return NextResponse.json({ success: false, error: error || 'Tidak terautentikasi' }, { status: 401 });
    }

    const body = await req.json();
    const { id, recipient_name, phone, address_line, city, province, postal_code, notes, is_default } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID alamat tidak ditemukan.' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Try DB update
    try {
      if (is_default) {
        await supabaseAdmin.from('addresses').update({ is_default: false }).eq('user_id', user.id);
      }
      await supabaseAdmin
        .from('addresses')
        .update({
          recipient_name: recipient_name?.trim(),
          phone: phone?.trim(),
          address_line: address_line?.trim(),
          city: city?.trim(),
          province: province?.trim(),
          postal_code: postal_code?.trim(),
          notes: notes?.trim() || '',
          is_default: Boolean(is_default),
          updated_at: now,
        })
        .eq('id', id)
        .eq('user_id', user.id); // Strict ownership check!
    } catch {
      // fallback
    }

    // Update metadata
    const currentList = getMetadataAddresses(user);
    const updatedList = currentList.map((a) => {
      if (a.id === id) {
        return {
          ...a,
          recipient_name: recipient_name?.trim() || a.recipient_name,
          phone: phone?.trim() || a.phone,
          address_line: address_line?.trim() || a.address_line,
          city: city?.trim() || a.city,
          province: province?.trim() || a.province,
          postal_code: postal_code?.trim() || a.postal_code,
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
    });
  } catch (err: unknown) {
    console.error('Update address error:', err);
    return NextResponse.json({ success: false, error: 'Gagal memperbarui alamat.' }, { status: 500 });
  }
}

/**
 * DELETE /api/user/addresses
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

    // DB delete with strict ownership check
    try {
      await supabaseAdmin.from('addresses').delete().eq('id', id).eq('user_id', user.id);
    } catch {
      // fallback
    }

    // Update metadata
    const currentList = getMetadataAddresses(user);
    const updatedList = currentList.filter((a) => a.id !== id);
    await saveMetadataAddresses(user, updatedList);

    return NextResponse.json({
      success: true,
      message: 'Alamat berhasil dihapus.',
    });
  } catch (err: unknown) {
    console.error('Delete address error:', err);
    return NextResponse.json({ success: false, error: 'Gagal menghapus alamat.' }, { status: 500 });
  }
}
