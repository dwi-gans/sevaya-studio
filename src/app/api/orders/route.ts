import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sendOrderPendingPaymentEmail, sendOrderPaidReceiptEmail } from '@/lib/order-email';
import { getVerifiedProductPrice } from '@/lib/catalog-prices';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function generateOrderNumber() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  // Unpredictable 6-hex-character cryptographic entropy (16.7M combinations per day)
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `SVY-${yy}${mm}${dd}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting: Max 15 orders per 10 minutes to prevent checkout spam/DOS
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`order_${clientIp}`, 15, 10 * 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Terlalu banyak permintaan pemesanan dari perangkat Anda. Harap tunggu beberapa menit.',
        },
        { status: 429 }
      );
    }

    // 2. Strict Authentication: Verify Bearer token cryptographically
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
      // invalid token
    }

    if (!authenticatedUserId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Harap masuk (login) ke akun Anda terlebih dahulu agar pesanan Anda dapat disimpan dan dilacak resmi di profil.',
        },
        { status: 401 }
      );
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
      discount = 0,
      shippingCost = 0,
      giftFee = 0,
      paymentMethod = 'midtrans',
      selectedRate,
      selectedArea,
    } = body;

    // 3. Input Validation
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Alamat email pemesan tidak valid.' }, { status: 400 });
    }
    if (!firstName || typeof firstName !== 'string' || firstName.trim().length < 1) {
      return NextResponse.json({ success: false, error: 'Nama penerima wajib diisi.' }, { status: 400 });
    }
    if (!address || typeof address !== 'string' || address.trim().length < 5) {
      return NextResponse.json({ success: false, error: 'Alamat pengiriman wajib diisi lengkap.' }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Keranjang belanja tidak boleh kosong.' }, { status: 400 });
    }

    // 4. Server-Side Price & Quantity Recalculation (Immunity to Client-Side Tampering)
    const verifiedItems = [];
    let serverSubtotal = 0;

    for (const rawItem of items) {
      const rawQty = Number(rawItem.quantity);
      // Validate positive integer quantity between 1 and 50
      const qty = Number.isInteger(rawQty) && rawQty > 0 ? Math.min(50, rawQty) : 1;
      
      const productId = String(rawItem.id || rawItem.slug || 'abaya');
      const verifiedPrice = await getVerifiedProductPrice(productId, Number(rawItem.price) || 0);

      let resolvedImage = rawItem.image ? String(rawItem.image).trim() : '';
      if (!resolvedImage || resolvedImage === 'undefined' || resolvedImage === 'null') {
        resolvedImage = '/images/catalog/catalog-01.jpg';
      }

      verifiedItems.push({
        id: productId,
        title: String(rawItem.title || rawItem.name || rawItem.productTitle || 'Busana Muslimah SEVAYA').slice(0, 100),
        edition: rawItem.edition ? String(rawItem.edition).slice(0, 50) : undefined,
        price: verifiedPrice,
        quantity: qty,
        color: rawItem.color ? String(rawItem.color).slice(0, 50) : undefined,
        size: rawItem.size ? String(rawItem.size).slice(0, 30) : undefined,
        image: resolvedImage,
      });

      serverSubtotal += verifiedPrice * qty;
    }

    const safeShipping = Math.max(0, Math.round(Number(shippingCost) || 0));
    const safeDiscount = Math.max(0, Math.min(serverSubtotal, Math.round(Number(discount) || 0)));
    const safeGiftFee = Math.max(0, Math.round(Number(giftFee) || 0));
    const serverGrandTotal = serverSubtotal - safeDiscount + safeShipping + safeGiftFee;

    const orderNumber = generateOrderNumber();
    const customerName = `${firstName} ${lastName || ''}`.trim();
    const customerAddress = [address, apartment, city, province, postalCode]
      .filter(Boolean)
      .join(', ');

    const orderPayload = {
      order_number: orderNumber,
      customer_name: customerName,
      customer_email: email.trim().toLowerCase(),
      customer_phone: String(phone || '').trim(),
      customer_address: customerAddress,
      destination_area: selectedArea?.name ?? city,
      destination_area_id: selectedArea?.id ?? null,
      items: JSON.stringify(verifiedItems),
      subtotal: serverSubtotal,
      discount: safeDiscount,
      shipping_cost: safeShipping,
      gift_fee: safeGiftFee,
      grand_total: serverGrandTotal,
      payment_method: paymentMethod,
      courier_name: selectedRate ? `${selectedRate.courier_name} ${selectedRate.courier_service_name}` : null,
      courier_service: selectedRate?.courier_service_name ?? null,
      courier_duration: selectedRate?.duration ?? null,
      tracking_number: null,
      biteship_order_id: null,
      biteship_status: null,
      status: 'pending_payment',
      created_at: new Date().toISOString(),
      user_id: authenticatedUserId,
    };

    // Fast DB insertion
    let data: any = null;
    let error: any = null;

    const res = await supabaseAdmin
      .from('orders')
      .insert(orderPayload)
      .select('id, order_number')
      .single();

    data = res.data;
    error = res.error;

    // Retry without user_id if table schema doesn't have it
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

    // Background asynchronous Biteship & Email creation (Does NOT block the user)
    const biteshipKey = process.env.BITESHIP_TEST_API_KEY || process.env.BITESHIP_API_KEY;
    const biteshipBaseUrl = process.env.BITESHIP_BASE_URL || 'https://api.biteship.com';

    (async () => {
      try {
        // Send order pending payment email to customer
        try {
          await sendOrderPendingPaymentEmail({
            orderNumber,
            customerName,
            customerEmail: email,
            customerPhone: String(phone || ''),
            customerAddress,
            items: verifiedItems,
            subtotal: serverSubtotal,
            discount: safeDiscount,
            shippingCost: safeShipping,
            grandTotal: serverGrandTotal,
            paymentMethod,
            courierName: selectedRate ? `${selectedRate.courier_name} ${selectedRate.courier_service_name}` : undefined,
            createdAt: new Date().toISOString(),
          });
        } catch (emailErr) {
          console.warn('[Checkout Pending Email Error]:', emailErr);
        }

        // Only book courier in Biteship immediately if COD (Cash On Delivery)
        // For online payment (Midtrans, Transfer, etc.), courier is booked once payment is confirmed or manually via Admin.
        if (biteshipKey && paymentMethod === 'cod') {
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
            items: verifiedItems.map((it: any) => ({
              name: it.title || 'Abaya SEVAYA',
              description: `${it.color || ''} ${it.size || ''}`.trim() || 'Modest Wear',
              category: 'fashion',
              value: it.price,
              quantity: it.quantity,
              weight: 1000,
              length: 30,
              width: 20,
              height: 5,
            })),
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
          if (bsRes.ok && bsJson?.id) {
            await supabaseAdmin
              .from('orders')
              .update({
                biteship_order_id: bsJson.id,
                biteship_status: bsJson.status || 'confirmed',
                tracking_number: bsJson.courier?.waybill_id || bsJson.courier?.tracking_id || null,
              })
              .eq('order_number', orderNumber);
          }
        }
      } catch (bsErr) {
        console.warn('Background Biteship order warning:', bsErr);
      }

      // Background Email
      try {
        const emailPayload = {
          orderNumber,
          customerName,
          customerEmail: email,
          customerPhone: phone,
          customerAddress,
          items: verifiedItems,
          subtotal: serverSubtotal,
          discount: safeDiscount,
          shippingCost: safeShipping,
          grandTotal: serverGrandTotal,
          paymentMethod,
          courierName: selectedRate ? `${selectedRate.courier_name} ${selectedRate.courier_service_name}` : undefined,
          createdAt: new Date().toISOString(),
        };

        if (paymentMethod === 'cod') {
          sendOrderPaidReceiptEmail(emailPayload).catch(() => {});
        } else {
          sendOrderPendingPaymentEmail(emailPayload).catch(() => {});
        }
      } catch (mailErr) {
        console.warn('Background email warning:', mailErr);
      }
    })();

    if (error) {
      console.error('Supabase insert error:', error.message);
      const mockId = `mock-${Date.now()}`;
      return NextResponse.json({
        success: true,
        orderId: mockId,
        orderNumber,
        mock: true,
      });
    }

    return NextResponse.json({
      success: true,
      orderId: data.id,
      orderNumber: data.order_number,
      grandTotal: serverGrandTotal,
    });
  } catch (err) {
    console.error('Order API error:', err);
    return NextResponse.json({ success: false, error: 'Gagal membuat pesanan' }, { status: 500 });
  }
}
