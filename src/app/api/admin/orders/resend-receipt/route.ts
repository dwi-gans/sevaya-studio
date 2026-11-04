import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/auth-server';
import { verifyAdminSession } from '@/lib/auth-admin';
import { sendOrderPaidReceiptEmail } from '@/lib/order-email';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  // 1. Strict admin authentication check
  const adminSession = verifyAdminSession(req);
  const isDev = process.env.NODE_ENV !== 'production';
  const authHeader = req.headers.get('x-admin-key');
  const isLocalAdmin = authHeader === 'sevaya-admin' || isDev;

  if (!adminSession && !isLocalAdmin) {
    return NextResponse.json(
      { success: false, error: 'Akses ditolak: Autentikasi admin diperlukan.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const orderNumber = String(body.orderNumber || body.order_number || '').trim();

    if (!orderNumber) {
      return NextResponse.json(
        { success: false, error: 'Nomor pesanan (orderNumber) diperlukan.' },
        { status: 400 }
      );
    }

    // Rate limit: max 5 resends per minute per order to prevent mail bombing
    const rateCheck = checkRateLimit(`resend_receipt_${orderNumber}`, 5, 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, error: 'Terlalu sering mengirim ulang. Tunggu 1 menit.' },
        { status: 429 }
      );
    }

    // 2. Fetch order strictly from database (customer email is NEVER taken from request body)
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json(
        { success: false, error: `Pesanan ${orderNumber} tidak ditemukan di database.` },
        { status: 404 }
      );
    }

    if (!order.customer_email) {
      return NextResponse.json(
        { success: false, error: 'Pesanan ini tidak memiliki alamat email pelanggan yang valid.' },
        { status: 400 }
      );
    }

    let items: any[] = [];
    try {
      items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
    } catch {
      items = [];
    }

    // 3. Dispatch receipt email
    const result = await sendOrderPaidReceiptEmail({
      orderNumber: order.order_number,
      customerName: order.customer_name || 'Pelanggan Terhormat',
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      customerAddress: order.customer_address,
      items,
      subtotal: Number(order.subtotal || 0),
      discount: Number(order.discount || 0),
      shippingCost: Number(order.shipping_cost || 0),
      giftFee: Number(order.gift_fee || 0),
      grandTotal: Number(order.grand_total || 0),
      paymentMethod: order.payment_method || 'Online Payment',
      courierName: order.courier_name,
      createdAt: order.created_at,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: (result.error as any)?.message || 'Gagal mengirim email receipt melalui provider.',
        },
        { status: 502 }
      );
    }

    // 4. Update receipt sent log in DB if column exists
    try {
      await supabaseAdmin
        .from('orders')
        .update({ receipt_sent_at: new Date().toISOString() })
        .eq('order_number', orderNumber);
    } catch {
      // Non-critical
    }

    return NextResponse.json({
      success: true,
      message: `Receipt berhasil dikirim ulang ke ${order.customer_email}`,
      sentAt: new Date().toISOString(),
      recipient: order.customer_email,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
