import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/auth-server';
import { verifyTripayCallback } from '@/integrations/tripay';
import { sendOrderCancelledEmail, sendOrderPaidReceiptEmail } from '@/lib/order-email';
import { sendAdminOrderNotification } from '@/lib/admin-order-notification';
import { deductStockForOrder } from '@/lib/inventory-server';

// In-memory idempotency cache untuk mencegah duplikasi email dari webhook ganda
const dispatchedReceipts = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let notification: any = {};
    try {
      notification = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid JSON payload' }, { status: 400 });
    }

    // 1. Verifikasi signature TriPay dari header X-Callback-Signature (Wajib valid di SEMUA environment)
    const receivedSignature = req.headers.get('X-Callback-Signature') || '';
    const isValid = verifyTripayCallback(rawBody, receivedSignature);

    if (!isValid) {
      console.warn('[TriPay Webhook] Signature mismatch atau notifikasi tidak terverifikasi');
      return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 401 });
    }

    // 2. Parse payload TriPay
    const orderNumber = notification.merchant_ref;
    const tripayStatus = String(notification.status || '').toUpperCase();
    const paymentChannel = notification.payment_method || notification.payment_method_code || 'TriPay';
    const paidAmount = Number(notification.amount_received || notification.total_amount || 0);

    if (!orderNumber) {
      console.warn('[TriPay Webhook] merchant_ref tidak ada dalam payload:', notification);
      return NextResponse.json({ success: false, message: 'Missing merchant_ref' }, { status: 400 });
    }

    console.log(`[TriPay Webhook] Order: ${orderNumber}, Status: ${tripayStatus}, Channel: ${paymentChannel}`);

    // 3. Map status TriPay → status internal
    // PAID = lunas, EXPIRED/FAILED = batal, UNPAID/WAITING = pending
    let internalStatus = 'pending_payment';
    if (tripayStatus === 'PAID') {
      internalStatus = 'paid';
    } else if (['EXPIRED', 'FAILED', 'CANCELLED'].includes(tripayStatus)) {
      internalStatus = 'cancelled';
    }

    // 4. Cek order di database
    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .maybeSingle();

    if (!existingOrder) {
      console.warn(`[TriPay Webhook] Order ${orderNumber} tidak ditemukan di database.`);
      return NextResponse.json({ success: true, message: 'Order not found, acknowledged' });
    }

    // 5. Proteksi amount tampering
    if (internalStatus === 'paid' && existingOrder.grand_total > 0 && paidAmount > 0) {
      if (paidAmount < Math.round(existingOrder.grand_total)) {
        console.error(
          `[TriPay Security Alert] Jumlah dibayar (${paidAmount}) kurang dari yang diharapkan (${existingOrder.grand_total}) untuk order ${orderNumber}!`,
        );
        return NextResponse.json({ success: false, message: 'Amount mismatch' }, { status: 400 });
      }
    }

    const wasAlreadyPaid =
      existingOrder.status === 'paid' ||
      existingOrder.status === 'processing' ||
      existingOrder.status === 'shipped' ||
      existingOrder.status === 'delivered';

    // Idempotency: Jika order sudah pernah tercatat lunas di database, segera return 200
    // untuk mencegah duplikasi pengurangan stok dan spam pengiriman email
    if (internalStatus === 'paid' && (wasAlreadyPaid || existingOrder.receipt_sent_at || dispatchedReceipts.has(orderNumber))) {
      console.log(`[TriPay Webhook] Order ${orderNumber} sudah berstatus paid sebelumnya. Webhook diakui (idempotent).`);
      return NextResponse.json({ success: true, message: 'Order already processed (idempotent)' });
    }

    // 6. Update order di Supabase
    const { data: updatedOrder, error } = await supabaseAdmin
      .from('orders')
      .update({
        status: internalStatus,
        payment_method: `TriPay (${paymentChannel})`,
        updated_at: new Date().toISOString(),
      })
      .eq('order_number', orderNumber)
      .select('*')
      .single();

    if (error) {
      console.error('[TriPay Webhook] DB update error:', error.message);
    } else if (internalStatus === 'paid' && updatedOrder && !wasAlreadyPaid && !existingOrder.receipt_sent_at && !dispatchedReceipts.has(orderNumber)) {
      dispatchedReceipts.add(orderNumber);
      // Hapus dari cache setelah 1 jam untuk mencegah memory leak
      setTimeout(() => dispatchedReceipts.delete(orderNumber), 60 * 60 * 1000);

      let items: any[] = [];
      try {
        items = typeof updatedOrder.items === 'string' ? JSON.parse(updatedOrder.items) : updatedOrder.items || [];
      } catch {
        items = [];
      }

      // 7. Kurangi stok otomatis
      try {
        await deductStockForOrder(
          items,
          orderNumber,
          updatedOrder.customer_name || 'Pelanggan',
        );
      } catch (stockErr) {
        console.warn('[TriPay Webhook] Stock deduction warning:', stockErr);
      }

      // 8. Kirim email bukti pembayaran ke pelanggan
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
          paymentMethod: updatedOrder.payment_method || 'TriPay',
          courierName: updatedOrder.courier_name,
          createdAt: updatedOrder.created_at,
        });

        // Catat timestamp email terkirim
        try {
          await supabaseAdmin
            .from('orders')
            .update({ receipt_sent_at: new Date().toISOString() })
            .eq('order_number', orderNumber);
        } catch {
          // Non-critical jika kolom belum ada
        }
      } catch (mailErr) {
        console.warn('[TriPay Webhook Paid Email Error]:', mailErr);
      }

      // 9. Kirim notifikasi ke admin
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
          paymentMethod: updatedOrder.payment_method || 'TriPay',
          courierName: updatedOrder.courier_name,
        });
      } catch (adminMailErr) {
        console.warn('[TriPay Admin Email Error]:', adminMailErr);
      }
    } else if (internalStatus === 'cancelled' && updatedOrder && existingOrder.status !== 'cancelled') {
      // Kirim email pembatalan
      try {
        let items: any[] = [];
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
          paymentMethod: updatedOrder.payment_method || 'TriPay',
          courierName: updatedOrder.courier_name,
          createdAt: updatedOrder.created_at,
          cancelReason: `Dibatalkan dari TriPay: ${tripayStatus}`,
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
          paymentMethod: updatedOrder.payment_method || 'TriPay',
          courierName: updatedOrder.courier_name,
          cancelReason: `Status TriPay: ${tripayStatus}`,
        });
      } catch (cancelMailErr) {
        console.warn('[TriPay Webhook Cancel Email Error]:', cancelMailErr);
      }
    }

    // Response wajib TriPay: { success: true }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[TriPay Webhook Handler Fatal Error]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
