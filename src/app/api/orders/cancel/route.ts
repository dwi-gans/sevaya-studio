import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOrderCancelledEmail } from '@/lib/order-email';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { verifyAdminSession } from '@/lib/auth-admin';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const { orderNumber, reason } = await req.json();

    if (!orderNumber || typeof orderNumber !== 'string') {
      return NextResponse.json({ success: false, error: 'Nomor pesanan wajib disertakan.' }, { status: 400 });
    }

    // 1. Fetch order from DB
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber.trim())
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ success: false, error: 'Pesanan tidak ditemukan.' }, { status: 404 });
    }

    // 2. Strict IDOR Authorization Check
    const { user } = await getAuthenticatedUser(req);
    const adminSession = verifyAdminSession(req);

    const isOwner = user && (
      (order.user_id && order.user_id === user.id) ||
      (order.customer_email && user.email && order.customer_email.toLowerCase() === user.email.toLowerCase())
    );

    const isAdmin = Boolean(adminSession);

    // Only the order owner or authenticated store admin can cancel
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Anda tidak memiliki izin untuk membatalkan pesanan ini.' },
        { status: 403 }
      );
    }

    // 3. Only cancel if status is still pending / pending_payment
    const nonCancellable = ['paid', 'processing', 'completed', 'shipped', 'delivered'];
    if (nonCancellable.includes(order.status)) {
      return NextResponse.json({
        success: false,
        message: 'Pesanan sudah berstatus lunas atau diproses, tidak dapat dibatalkan.',
        currentStatus: order.status,
      });
    }

    // If already cancelled, return success
    if (order.status === 'cancelled') {
      return NextResponse.json({ success: true, alreadyCancelled: true, status: 'cancelled' });
    }

    // Update status to cancelled in DB
    const { error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('order_number', orderNumber.trim());

    if (updateErr) {
      console.error('[Cancel Order Error]:', updateErr.message);
      return NextResponse.json({ success: false, error: 'Gagal memperbarui status pembatalan pesanan.' }, { status: 500 });
    }

    // Parse items for cancellation email
    let items = [];
    try {
      items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
    } catch {
      items = [];
    }

    // Send cancellation email in background / async
    sendOrderCancelledEmail({
      orderNumber: order.order_number,
      customerName: order.customer_name || 'Pelanggan Terhormat',
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      customerAddress: order.customer_address,
      items,
      subtotal: Number(order.subtotal || 0),
      discount: Number(order.discount || 0),
      shippingCost: Number(order.shipping_cost || 0),
      grandTotal: Number(order.grand_total || 0),
      paymentMethod: order.payment_method || 'Midtrans',
      courierName: order.courier_name,
      createdAt: order.created_at,
      cancelReason: reason || 'Permintaan pembatalan oleh pelanggan',
    }).catch((mailErr) => console.warn('[Cancel Order Mail Warning]:', mailErr));

    return NextResponse.json({
      success: true,
      cancelled: true,
      orderNumber: order.order_number,
      status: 'cancelled',
    });
  } catch (err: any) {
    console.error('[API Cancel Order Error]:', err);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server saat memproses pembatalan.' }, { status: 500 });
  }
}
