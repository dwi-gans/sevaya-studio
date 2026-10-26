import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkMidtransStatus } from '@/integrations/midtrans';
import { sendOrderPaidReceiptEmail } from '@/lib/order-email';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const { order_id } = await req.json();
    if (!order_id) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const midtransData = await checkMidtransStatus(order_id);
    const transStatus = midtransData?.transaction_status;

    if (transStatus === 'settlement' || transStatus === 'capture') {
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('order_number', order_id)
        .single();

      const wasAlreadyPaid = order?.status === 'paid' || order?.status === 'processing';

      await supabaseAdmin
        .from('orders')
        .update({
          status: 'paid',
          updated_at: new Date().toISOString(),
        })
        .eq('order_number', order_id);

      if (!wasAlreadyPaid && order) {
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
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
