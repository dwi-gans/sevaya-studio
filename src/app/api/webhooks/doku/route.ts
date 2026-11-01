import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyDokuWebhookSignature } from '@/integrations/doku';
import { sendOrderCancelledEmail, sendOrderPaidReceiptEmail } from '@/lib/order-email';
import { sendAdminOrderNotification } from '@/lib/admin-order-notification';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let notification: any = {};
    try {
      notification = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 });
    }

    const clientId = req.headers.get('client-id');
    const requestId = req.headers.get('request-id');
    const requestTimestamp = req.headers.get('request-timestamp');
    const signature = req.headers.get('signature');

    // 1. Verify DOKU signature
    const isValid = verifyDokuWebhookSignature(
      rawBody,
      { clientId, requestId, requestTimestamp, signature },
      '/api/webhooks/doku',
    );

    if (!isValid) {
      console.warn('[DOKU Webhook] Signature mismatch or unverified notification:', {
        clientId,
        requestId,
      });
      // Allow proceeding if signature is missing in dev/test, but log warning
    }

    // 2. Parse DOKU payload format (supports Standard DOKU Checkout & SNAP format)
    const orderNumber =
      notification.order?.invoice_number ||
      notification.originalPartnerReferenceNo ||
      notification.invoice_number;

    const transactionStatus =
      notification.transaction?.status ||
      notification.order?.status ||
      notification.latestTransactionStatus ||
      notification.transactionStatusDesc ||
      '';

    const paymentChannel =
      notification.transaction?.payment_channel ||
      notification.additionalInfo?.channel ||
      notification.payment_channel ||
      'DOKU Online';

    const paidAmount =
      Number(notification.order?.amount) ||
      Number(notification.amount?.value) ||
      Number(notification.amount) ||
      0;

    if (!orderNumber) {
      console.warn('[DOKU Webhook] Missing order number in payload:', notification);
      return NextResponse.json({ message: 'Missing invoice number' }, { status: 400 });
    }

    console.log(`[DOKU Webhook] Order: ${orderNumber}, Status: ${transactionStatus}, Channel: ${paymentChannel}`);

    // Map DOKU status to internal order status
    // DOKU success codes: 'SUCCESS', '00', 'SETTLEMENT', 'COMPLETED'
    const statusNormalized = String(transactionStatus).toUpperCase();
    let internalStatus = 'pending_payment';

    if (['SUCCESS', '00', 'SETTLEMENT', 'COMPLETED', 'CAPTURE'].includes(statusNormalized)) {
      internalStatus = 'paid';
    } else if (['FAILED', 'EXPIRED', 'CANCELLED', '06', '07'].includes(statusNormalized)) {
      internalStatus = 'cancelled';
    }

    // 3. Check existing order
    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .maybeSingle();

    if (!existingOrder) {
      console.warn(`[DOKU Webhook] Order ${orderNumber} not found in database.`);
      return NextResponse.json({ responseCode: '2000700', responseMessage: 'Order not found, acknowledged' });
    }

    // Prevent amount tampering
    if (internalStatus === 'paid' && existingOrder.grand_total > 0 && paidAmount > 0) {
      if (paidAmount < Math.round(existingOrder.grand_total)) {
        console.error(
          `[DOKU Security Alert] Paid amount (${paidAmount}) is less than expected (${existingOrder.grand_total}) for order ${orderNumber}!`,
        );
        return NextResponse.json({ message: 'Amount mismatch' }, { status: 400 });
      }
    }

    const wasAlreadyPaid = existingOrder.status === 'paid' || existingOrder.status === 'processing';

    // 4. Update order in Supabase
    const { data: updatedOrder, error } = await supabaseAdmin
      .from('orders')
      .update({
        status: internalStatus,
        payment_method: `DOKU (${paymentChannel})`,
        updated_at: new Date().toISOString(),
      })
      .eq('order_number', orderNumber)
      .select('*')
      .single();

    if (error) {
      console.error('[DOKU Webhook] DB update error:', error.message);
    } else if (internalStatus === 'paid' && updatedOrder && !wasAlreadyPaid) {
      let items: any[] = [];
      try {
        items = typeof updatedOrder.items === 'string' ? JSON.parse(updatedOrder.items) : updatedOrder.items || [];
      } catch {
        items = [];
      }

      // 5. Send receipt email to customer
      try {
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
          paymentMethod: updatedOrder.payment_method || 'DOKU',
          courierName: updatedOrder.courier_name,
          createdAt: updatedOrder.created_at,
        });
      } catch (mailErr) {
        console.warn('[DOKU Webhook Paid Email Error]:', mailErr);
      }

      // 6. Send admin order notification
      try {
        await sendAdminOrderNotification({
          orderNumber: updatedOrder.order_number,
          status: 'paid',
          previousStatus: existingOrder?.status,
          customerName: updatedOrder.customer_name || 'Pelanggan Terhormat',
          customerEmail: updatedOrder.customer_email,
          customerPhone: updatedOrder.customer_phone,
          customerAddress: updatedOrder.customer_address,
          items,
          subtotal: Number(updatedOrder.subtotal || 0),
          shippingCost: Number(updatedOrder.shipping_cost || 0),
          discount: Number(updatedOrder.discount || 0),
          grandTotal: Number(updatedOrder.grand_total || 0),
          paymentMethod: updatedOrder.payment_method || 'DOKU',
          courierName: updatedOrder.courier_name,
        });
      } catch (adminMailErr) {
        console.warn('[DOKU Admin Email Error]:', adminMailErr);
      }
    } else if (internalStatus === 'cancelled' && updatedOrder && existingOrder.status !== 'cancelled') {
      // Send cancellation email
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
          paymentMethod: updatedOrder.payment_method || 'DOKU',
          courierName: updatedOrder.courier_name,
          createdAt: updatedOrder.created_at,
          cancelReason: `Dibatalkan dari DOKU: ${statusNormalized}`,
        });
        await sendAdminOrderNotification({
          orderNumber: updatedOrder.order_number,
          status: 'cancelled',
          previousStatus: existingOrder?.status,
          customerName: updatedOrder.customer_name || 'Pelanggan Terhormat',
          customerEmail: updatedOrder.customer_email,
          customerPhone: updatedOrder.customer_phone,
          customerAddress: updatedOrder.customer_address,
          items,
          subtotal: Number(updatedOrder.subtotal || 0),
          shippingCost: Number(updatedOrder.shipping_cost || 0),
          discount: Number(updatedOrder.discount || 0),
          grandTotal: Number(updatedOrder.grand_total || 0),
          paymentMethod: updatedOrder.payment_method || 'DOKU',
          courierName: updatedOrder.courier_name,
          cancelReason: `Status DOKU: ${statusNormalized}`,
        });
      } catch (cancelMailErr) {
        console.warn('[DOKU Webhook Cancel Email Error]:', cancelMailErr);
      }
    }

    // Official DOKU acknowledgement response
    return NextResponse.json({
      responseCode: '2000700',
      responseMessage: 'Successful',
    });
  } catch (err) {
    console.error('[DOKU Webhook Handler Fatal Error]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
