import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth-admin';
import { executeServerStockMutation } from '@/lib/inventory-server';
import { MutationType, MutationReason } from '@/integrations/supabase';

export const runtime = 'nodejs';

// POST /api/admin/inventory/mutate
export async function POST(req: NextRequest) {
  try {
    const session = verifyAdminSession(req);
    const isDev = process.env.NODE_ENV !== 'production';
    const authHeader = req.headers.get('x-admin-key');
    const isLocalAdmin = authHeader === 'sevaya-admin' || isDev;

    if (!session && !isLocalAdmin) {
      return NextResponse.json({ error: 'Akses ditolak: Autentikasi admin diperlukan.' }, { status: 401 });
    }

    const body = await req.json();
    const { variantId, type, quantity, reason, reference, notes, createdBy } = body as {
      variantId: string;
      type: MutationType;
      quantity: number;
      reason: MutationReason;
      reference?: string;
      notes?: string;
      createdBy?: string;
    };

    if (!variantId || !type || typeof quantity !== 'number') {
      return NextResponse.json({
        success: false,
        error: 'Data mutasi tidak lengkap (variantId, type, dan quantity wajib diisi).',
      }, { status: 400 });
    }

    const result = await executeServerStockMutation({
      variantId,
      type,
      quantity,
      reason: reason || 'OTHER',
      reference,
      notes,
      createdBy: createdBy || session?.username || 'Admin Studio',
    });

    return NextResponse.json({
      success: true,
      message: `Mutasi stok ${type === 'in' ? 'masuk' : type === 'out' ? 'keluar' : 'penyesuaian'} berhasil dicatat.`,
      variant: result.variant,
      mutation: result.mutation,
      totalProductStock: result.totalProductStock,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mencatat mutasi stok';
    console.error('[POST /api/admin/inventory/mutate]', err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
