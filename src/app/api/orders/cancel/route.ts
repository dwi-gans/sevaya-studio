import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOrderCancelledEmail } from '@/lib/order-email';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const { orderNumber, reason } = await req.json();

    if (!orderNumber) {
      return NextResponse.json({ success: false, error: 'Order number is required' }, { status: 400 });
    }

    // Fetch order from DB
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Only cancel if status is still pending / pending_payment
    const nonCancellable = ['paid', 'processing', 'completed', 'shipped'];
    if (nonCancellable.includes(order.status)) {
      return NextResponse.json({
        success: false,
        message: 'Pesanan sudah berstatus lunas atau diproses.',
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
      .eq('order_number', orderNumber);

    if (updateErr) {
      console.error('[Cancel Order Error]:', updateErr.message);
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    // Parse items for cancellation email
    let items = [];
    try {
      items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
    } catch {
      items = [];
    }

    // Send cancellation email in background / async
    await sendOrderCancelledEmail({
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
      cancelReason: reason || 'Melewati batas waktu pembayaran 10 menit',
    });

    return NextResponse.json({
      success: true,
      cancelled: true,
      orderNumber,
      status: 'cancelled',
    });
  } catch (err: any) {
    console.error('[API Cancel Order Error]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
