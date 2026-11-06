import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/auth-server';
import { verifyAdminSession } from '@/lib/auth-admin';
import { checkMidtransStatus } from '@/integrations/midtrans';
import { sendOrderPaidReceiptEmail } from '@/lib/order-email';

export async function POST(req: NextRequest) {
  try {
    // 1. Verifikasi autentikasi user atau admin
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    let authenticatedUserId: string | null = null;
    let authenticatedEmail: string | null = null;
    const adminSession = verifyAdminSession(req);

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      try {
        const { data: authData } = await supabaseAdmin.auth.getUser(token);
        if (authData?.user) {
          authenticatedUserId = authData.user.id;
          authenticatedEmail = authData.user.email?.toLowerCase() || null;
        }
      } catch {
        // Invalid token
      }
    }

    if (!adminSession && !authenticatedUserId && !authenticatedEmail) {
      return NextResponse.json({ success: false, error: 'Autentikasi diperlukan.' }, { status: 401 });
    }

    const { order_id } = await req.json();
    if (!order_id) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('order_number', order_id)
      .maybeSingle();

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Ownership check jika bukan admin
    if (!adminSession) {
      const matchUser = authenticatedUserId && order.user_id && order.user_id === authenticatedUserId;
      const matchEmail = authenticatedEmail && order.customer_email && order.customer_email.toLowerCase() === authenticatedEmail;
      if (order.user_id && !matchUser && !matchEmail) {
        return NextResponse.json({ success: false, error: 'Akses ditolak.' }, { status: 403 });
      }
    }

    const midtransData = await checkMidtransStatus(order_id);
    const transStatus = midtransData?.transaction_status;

    if (transStatus === 'settlement' || transStatus === 'capture') {
      // Verify gross amount paid in Midtrans matches database grand total
      const paidAmount = Math.round(Number(midtransData?.gross_amount) || 0);
      const expectedAmount = Math.round(Number(order.grand_total) || 0);
      if (expectedAmount > 0 && paidAmount < expectedAmount) {
        console.error(`[Verify Payment Amount Mismatch] Order: ${order_id}, Expected: ${expectedAmount}, Paid: ${paidAmount}`);
        return NextResponse.json(
          { success: false, error: 'Jumlah pembayaran tidak sesuai dengan tagihan pesanan.' },
          { status: 400 }
        );
      }

      const wasAlreadyPaid = order.status === 'paid' || order.status === 'processing';

      await supabaseAdmin
        .from('orders')
        .update({
          status: 'paid',
          updated_at: new Date().toISOString(),
        })
        .eq('order_number', order_id);

      if (!wasAlreadyPaid) {
        let items = [];
        try {
          items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
        } catch {
          items = [];
        }
        sendOrderPaidReceiptEmail({
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
        }).catch((err) => console.warn('[Payment Verify Paid Mail Error]:', err));
      }

      return NextResponse.json({
        success: true,
        paid: true,
        transaction_status: transStatus,
      });
    }

    return NextResponse.json({
      success: true,
      paid: false,
      transaction_status: transStatus || 'unknown',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Gagal memverifikasi status pembayaran.' }, { status: 500 });
  }
}
