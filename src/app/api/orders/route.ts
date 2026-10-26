import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOrderPendingPaymentEmail, sendOrderPaidReceiptEmail } from '@/lib/order-email';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function generateOrderNumber() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SVY-${yy}${mm}${dd}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    let authenticatedUserId: string | null = null;
    try {
      const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        const { data: authData } = await supabaseAdmin.auth.getUser(token);
        if (authData?.user) {
          authenticatedUserId = authData.user.id;
        }
      }
    } catch {
      // optional auth
    }

    const body = await req.json();

    const {
      email,
      firstName,
      lastName,
      phone,
      address,
      apartment,
      city,
      province,
      postalCode,
      items,
      subtotal,
      discount,
      shippingCost,
      giftFee,
      grandTotal,
      paymentMethod,
      selectedRate,
      selectedArea,
      userId,
    } = body;

    const finalUserId = authenticatedUserId || userId || null;
    if (!finalUserId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Harap masuk (login) ke akun Anda terlebih dahulu agar pesanan Anda dapat disimpan dan dilacak resmi di profil.',
        },
        { status: 401 }
      );
    }

    const orderNumber = generateOrderNumber();
    const customerName = `${firstName} ${lastName}`.trim();
    const customerAddress = [address, apartment, city, province, postalCode]
      .filter(Boolean)
      .join(', ');

    // Call Biteship API to create official shipment order
    const biteshipKey = process.env.BITESHIP_TEST_API_KEY || process.env.BITESHIP_API_KEY;
    const biteshipBaseUrl = process.env.BITESHIP_BASE_URL || 'https://api.biteship.com';
    let biteshipOrderId: string | null = null;
    let biteshipStatus: string | null = null;
    let waybillId: string | null = null;

    if (biteshipKey) {
      try {
        let courierCompany = (selectedRate?.courier_code || selectedRate?.company || 'jne').toLowerCase();
        let rawService = (selectedRate?.type || selectedRate?.courier_service_code || selectedRate?.courier_service_name || 'reg').toLowerCase();
        let courierService = 'reg';
        if (rawService.includes('best') || rawService.includes('yes') || rawService.includes('ons')) {
          courierService = 'yes';
        } else if (rawService.includes('instant')) {
          courierService = 'instant';
        } else if (rawService.includes('same')) {
          courierService = 'same_day';
        } else if (rawService.includes('jtr') || rawService.includes('cargo') || rawService.includes('truck')) {
          courierService = 'cargo';
        } else {
          courierService = 'reg';
        }

        let safePhone = String(phone || '').replace(/\D/g, '');
        if (!safePhone.startsWith('08') && !safePhone.startsWith('62')) {
          safePhone = '0812' + safePhone.padEnd(8, '0').slice(0, 8);
        }

        const biteshipPayload = {
          shipper_contact_name: 'SEVAYA Store',
          shipper_contact_phone: '08123456789',
          shipper_contact_email: 'store@sevaya.id',
          shipper_organization: 'SEVAYA',
          origin_contact_name: 'SEVAYA Store',
          origin_contact_phone: '08123456789',
          origin_address: 'Jl. Kebon Jeruk No. 10, Jakarta Barat',
          origin_note: 'Gudang SEVAYA',
          origin_postal_code: Number(process.env.BITESHIP_ORIGIN_POSTAL_CODE) || 11450,
          destination_contact_name: customerName,
          destination_contact_phone: safePhone,
          destination_contact_email: email,
          destination_address: customerAddress,
          destination_postal_code: Number(postalCode) || 12190,
          destination_note: `Pesanan #${orderNumber}`,
          courier_company: courierCompany,
          courier_type: courierService,
          delivery_type: 'now',
          reference_id: orderNumber,
          order_note: `SEVAYA Order #${orderNumber}`,
          items: Array.isArray(items) && items.length > 0
            ? items.map((it: any) => ({
                name: it.title || it.name || 'Abaya SEVAYA',
                description: `${it.color || ''} ${it.size || ''}`.trim() || 'Modest Wear',
                category: 'fashion',
                value: it.price || 350000,
                quantity: it.quantity || 1,
                weight: 1000,
                length: 30,
                width: 20,
                height: 5,
              }))
            : [
                {
                  name: 'SEVAYA Modest Wear',
                  description: orderNumber,
                  category: 'fashion',
                  value: grandTotal || 350000,
                  quantity: 1,
                  weight: 1000,
                  length: 30,
                  width: 20,
                  height: 5,
                },
              ],
        };

        const bsRes = await fetch(`${biteshipBaseUrl}/v1/orders`, {
          method: 'POST',
          headers: {
            Authorization: biteshipKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(biteshipPayload),
        });

        const bsJson = await bsRes.json();
        console.log('[Biteship Checkout Order Created]:', bsJson?.id, bsJson?.status);

        if (bsRes.ok && bsJson?.id) {
          biteshipOrderId = bsJson.id;
          biteshipStatus = bsJson.status || 'confirmed';
          waybillId = bsJson.courier?.waybill_id || bsJson.courier?.tracking_id || null;
        } else {
          console.error('[Biteship Order Creation Failed]:', bsRes.status, bsJson);
        }
      } catch (bsErr) {
        console.warn('[Biteship Order Creation Warning]:', bsErr);
      }
    }

    const orderPayload = {
      order_number: orderNumber,
      customer_name: customerName,
      customer_email: email,
      customer_phone: phone,
      customer_address: customerAddress,
      destination_area: selectedArea?.name ?? city,
      destination_area_id: selectedArea?.id ?? null,
      items: JSON.stringify(items),
      subtotal: subtotal ?? 0,
      discount: discount ?? 0,
      shipping_cost: shippingCost ?? 0,
      gift_fee: giftFee ?? 0,
      grand_total: grandTotal ?? 0,
      payment_method: paymentMethod,
      courier_name: selectedRate ? `${selectedRate.courier_name} ${selectedRate.courier_service_name}` : null,
      courier_service: selectedRate?.courier_service_name ?? null,
      courier_duration: selectedRate?.duration ?? null,
      tracking_number: waybillId,
      biteship_order_id: biteshipOrderId,
      biteship_status: biteshipStatus,
      status: 'pending_payment',
      created_at: new Date().toISOString(),
      ...(finalUserId ? { user_id: finalUserId } : {}),
    };

    // Try to insert into Supabase orders table
    let data: any = null;
    let error: any = null;

    const res = await supabaseAdmin
      .from('orders')
      .insert(orderPayload)
      .select('id, order_number')
      .single();

    data = res.data;
    error = res.error;

    // If error indicates column user_id does not exist, retry without user_id
    if (error && error.message?.includes('user_id')) {
      const { user_id: _, ...payloadWithoutUserId } = orderPayload;
      const retryRes = await supabaseAdmin
        .from('orders')
        .insert(payloadWithoutUserId)
        .select('id, order_number')
        .single();
      data = retryRes.data;
      error = retryRes.error;
    }

    // Automatically send email notification based on payment method
    const emailPayload = {
      orderNumber,
      customerName,
      customerEmail: email,
      customerPhone: phone,
      customerAddress,
      items: Array.isArray(items) ? items : [],
      subtotal: subtotal ?? 0,
      discount: discount ?? 0,
      shippingCost: shippingCost ?? 0,
      grandTotal: grandTotal ?? 0,
      paymentMethod,
      courierName: selectedRate ? `${selectedRate.courier_name} ${selectedRate.courier_service_name}` : undefined,
      createdAt: new Date().toISOString(),
    };

    if (paymentMethod === 'cod') {
      sendOrderPaidReceiptEmail(emailPayload).catch((emailErr) =>
        console.warn('Send order COD receipt email warning:', emailErr)
      );
    } else {
      sendOrderPendingPaymentEmail(emailPayload).catch((emailErr) =>
        console.warn('Send order pending payment email warning:', emailErr)
      );
    }

    if (error) {
      console.error('Supabase insert error:', error.message);
      const mockId = `mock-${Date.now()}`;
      return NextResponse.json({
        success: true,
        orderId: mockId,
        orderNumber,
        biteship_order_id: biteshipOrderId,
        mock: true,
      });
    }

    return NextResponse.json({
      success: true,
      orderId: data.id,
      orderNumber: data.order_number,
      biteship_order_id: biteshipOrderId,
    });
  } catch (err) {
    console.error('Order API error:', err);
    return NextResponse.json({ success: false, error: 'Gagal membuat pesanan' }, { status: 500 });
  }
}
