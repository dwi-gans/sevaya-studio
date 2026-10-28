import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyMidtransSignature } from '@/integrations/midtrans';
import { sendOrderCancelledEmail, sendOrderPaidReceiptEmail } from '@/lib/order-email';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const notification = await req.json();

    const orderId = notification.order_id;
    const statusCode = notification.status_code;
    const grossAmount = notification.gross_amount;
    const signatureKey = notification.signature_key;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;
    const paymentType = notification.payment_type;

    // Verify signature
    const isValid = verifyMidtransSignature(orderId, statusCode, grossAmount, signatureKey);
    if (!isValid) {
      console.warn('[Midtrans Webhook] Invalid signature for order:', orderId);
      return NextResponse.json({ message: 'Invalid signature' }, { status: 403 });
    }

    console.log(`[Midtrans Webhook] Order: ${orderId}, Status: ${transactionStatus}, Type: ${paymentType}`);

    let internalStatus = 'pending_payment';

    if (transactionStatus === 'capture') {
      if (fraudStatus === 'accept') {
        internalStatus = 'paid';
      }
    } else if (transactionStatus === 'settlement') {
      internalStatus = 'paid';
    } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
      internalStatus = 'cancelled';
    } else if (transactionStatus === 'pending') {
      internalStatus = 'pending_payment';
    }

    // Check existing order status and grand total to prevent duplicate notifications and amount tampering
    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('status, grand_total')
      .eq('order_number', orderId)
      .single();

    // Verify gross amount matches the recorded grand total in database
    if (internalStatus === 'paid' && existingOrder) {
      const webhookAmount = Math.round(Number(grossAmount) || 0);
      const expectedAmount = Math.round(Number(existingOrder.grand_total) || 0);

      if (expectedAmount > 0 && webhookAmount < expectedAmount) {
        console.error(
          `[Midtrans Webhook Security Alert] Paid amount (${webhookAmount}) is less than expected order total (${expectedAmount}) for order ${orderId}!`
        );
        return NextResponse.json({ message: 'Amount mismatch detected' }, { status: 400 });
      }
    }

    const wasAlreadyPaid = existingOrder?.status === 'paid' || existingOrder?.status === 'processing';

    // Update order in Supabase
    const { data: updatedOrder, error } = await supabaseAdmin
      .from('orders')
      .update({
        status: internalStatus,
        payment_method: `Midtrans (${paymentType || 'Online'})`,
        updated_at: new Date().toISOString(),
      })
      .eq('order_number', orderId)
      .select('*')
      .single();

    if (error) {
      console.error('[Midtrans Webhook] Failed to update order status:', error.message);
    } else if (internalStatus === 'paid' && updatedOrder && !wasAlreadyPaid) {
      // Send official paid receipt email
      try {
        let items = [];
        try {
          items = typeof updatedOrder.items === 'string' ? JSON.parse(updatedOrder.items) : updatedOrder.items || [];
        } catch {
          items = [];
        }
        await sendOrderPaidReceiptEmail({
          orderNumber: updatedOrder.order_number,
          customerName: updatedOrder.customer_name || 'Pelanggan Terhormat',
          customerEmail: updatedOrder.customer_email,
          customerPhone: updatedOrder.customer_phone,
          customerAddress: updatedOrder.customer_address,
          items,
          subtotal: Number(updatedOrder.subtotal || 0),
          discount: Number(updatedOrder.discount || 0),
          shippingCost: Number(updatedOrder.shipping_cost || 0),
          grandTotal: Number(updatedOrder.grand_total || 0),
          paymentMethod: updatedOrder.payment_method || 'Midtrans',
          courierName: updatedOrder.courier_name,
          createdAt: updatedOrder.created_at,
        });
      } catch (mailErr) {
        console.warn('[Midtrans Webhook Paid Mail Error]:', mailErr);
      }
    } else if (internalStatus === 'cancelled' && updatedOrder && existingOrder?.status !== 'cancelled') {
      // Send cancellation email when expired or cancelled
      try {
        let items = [];
        try {
          items = typeof updatedOrder.items === 'string' ? JSON.parse(updatedOrder.items) : updatedOrder.items || [];
        } catch {
          items = [];
        }
        await sendOrderCancelledEmail({
          orderNumber: updatedOrder.order_number,
          customerName: updatedOrder.customer_name || 'Pelanggan Terhormat',
          customerEmail: updatedOrder.customer_email,
          customerPhone: updatedOrder.customer_phone,
          customerAddress: updatedOrder.customer_address,
          items,
          subtotal: Number(updatedOrder.subtotal || 0),
          discount: Number(updatedOrder.discount || 0),
          shippingCost: Number(updatedOrder.shipping_cost || 0),
          grandTotal: Number(updatedOrder.grand_total || 0),
          paymentMethod: updatedOrder.payment_method || 'Midtrans',
          courierName: updatedOrder.courier_name,
          createdAt: updatedOrder.created_at,
          cancelReason: `Status Midtrans: ${transactionStatus}`,
        });
      } catch (mailErr) {
        console.warn('[Midtrans Webhook Cancel Mail Error]:', mailErr);
      }
    }

    return NextResponse.json({ success: true, message: 'Notification processed' });
  } catch (err) {
    console.error('[Midtrans Webhook Error]:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
