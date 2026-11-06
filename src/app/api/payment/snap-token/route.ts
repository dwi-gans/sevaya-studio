import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/auth-server';
import { createTripayTransaction } from '@/integrations/tripay';

export async function POST(req: NextRequest) {
  try {
    // 1. Verifikasi autentikasi user
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    let authenticatedUserId: string | null = null;
    let authenticatedEmail: string | null = null;

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

    const body = await req.json();
    const {
      order_id,
      grand_total: clientGrandTotal,
      items: clientItems,
      customer: clientCustomer,
      payment_method,
    } = body;

    if (!order_id) {
      return NextResponse.json(
        { success: false, error: 'Nomor pesanan (order_id) wajib disertakan.' },
        { status: 400 },
      );
    }

    // Ambil data order dari DB untuk pastikan harga & status tidak bisa dimanipulasi client
    let finalGrandTotal = Number(clientGrandTotal) || 0;
    let finalItems = clientItems;
    let finalCustomer = clientCustomer;

    try {
      const { data: dbOrder } = await supabaseAdmin
        .from('orders')
        .select('grand_total, items, customer_name, customer_email, customer_phone, user_id, status')
        .eq('order_number', order_id)
        .maybeSingle();

      if (dbOrder) {
        // Jangan izinkan transaksi baru jika order sudah lunas
        if (['paid', 'processing', 'shipped', 'delivered'].includes(dbOrder.status)) {
          return NextResponse.json(
            { success: false, error: 'Pesanan ini sudah berstatus lunas atau sedang diproses.' },
            { status: 400 },
          );
        }

        // Validasi kepemilikan (Ownership check)
        if (authenticatedUserId || authenticatedEmail) {
          const matchUser = authenticatedUserId && dbOrder.user_id && dbOrder.user_id === authenticatedUserId;
          const matchEmail = authenticatedEmail && dbOrder.customer_email && dbOrder.customer_email.toLowerCase() === authenticatedEmail;
          if (dbOrder.user_id && !matchUser && !matchEmail) {
            return NextResponse.json(
              { success: false, error: 'Akses ditolak: Anda tidak memiliki akses ke pesanan ini.' },
              { status: 403 },
            );
          }
        } else {
          // Jika tidak ada Bearer token, wajib mencocokkan email pemesan
          const providedEmail = clientCustomer?.email?.trim().toLowerCase();
          const dbEmail = dbOrder.customer_email?.trim().toLowerCase();
          if (!providedEmail || providedEmail !== dbEmail) {
            return NextResponse.json(
              { success: false, error: 'Autentikasi atau verifikasi email pemesan diperlukan untuk mengakses pembayaran pesanan ini.' },
              { status: 401 },
            );
          }
        }

        if (typeof dbOrder.grand_total === 'number' && dbOrder.grand_total > 0) {
          finalGrandTotal = Math.round(dbOrder.grand_total);
        }

        if (dbOrder.items) {
          try {
            const parsed = typeof dbOrder.items === 'string' ? JSON.parse(dbOrder.items) : dbOrder.items;
            if (Array.isArray(parsed) && parsed.length > 0) {
              finalItems = parsed.map((it: any, idx: number) => ({
                id: String(it.id || `item-${idx}`),
                name: String(it.title || it.name || 'Abaya SEVAYA'),
                price: Math.round(Number(it.price) || finalGrandTotal),
                quantity: Math.round(Number(it.quantity) || 1),
              }));
            }
          } catch { /* fallback ke client items */ }
        }

        const nameParts = (dbOrder.customer_name || '').split(' ');
        finalCustomer = {
          first_name: nameParts[0] || 'Pelanggan',
          last_name: nameParts.slice(1).join(' ') || '',
          email: dbOrder.customer_email || clientCustomer?.email || '',
          phone: dbOrder.customer_phone || clientCustomer?.phone || '',
        };
      }
    } catch (dbErr) {
      console.warn('[Payment Token DB Lookup Warning]:', dbErr);
    }

    if (!finalGrandTotal || finalGrandTotal <= 0) {
      return NextResponse.json(
        { success: false, error: 'Nominal transaksi tidak valid.' },
        { status: 400 },
      );
    }

    // Mapping payment_method → TriPay channel code (hanya channel aktif merchant)
    const tripayChannelMap: Record<string, string> = {
      qris:       'QRIS',
      va_bca:     'BCAVA',
      va_mandiri: 'MANDIRIVA',
      va_bri:     'BRIVA',
      va_bni:     'BNIVA',
    };

    const tripayChannel = tripayChannelMap[payment_method] || 'QRIS';

    const customerFullName =
      [finalCustomer?.first_name, finalCustomer?.last_name].filter(Boolean).join(' ') ||
      'Pelanggan SEVAYA';

    // ── Build order_items yang sum(price*qty) == amount persis ──
    // TriPay menolak request jika total item != amount ("Inconsistent: order_items != amount")
    let builtItems: { name: string; price: number; quantity: number }[] = [];

    if (Array.isArray(finalItems) && finalItems.length > 0) {
      builtItems = finalItems.map((it: any) => ({
        name: String(it.name || it.title || 'Produk SEVAYA').slice(0, 50),
        price: Math.round(Number(it.price) || 0),
        quantity: Math.max(1, Math.round(Number(it.quantity) || 1)),
      }));

      // Hitung selisih antara sum item vs amount aktual
      const itemsTotal = builtItems.reduce((s, it) => s + it.price * it.quantity, 0);
      const diff = finalGrandTotal - itemsTotal;

      if (diff !== 0) {
        if (diff > 0) {
          // Ada biaya tambahan (ongkir, biaya layanan, dll) → tambah item baru
          builtItems.push({
            name: 'Biaya Pengiriman & Layanan',
            price: diff,
            quantity: 1,
          });
        } else {
          // Ada diskon / selisih negatif → distribusikan ke item pertama
          const firstItem = builtItems[0];
          if (firstItem) {
            firstItem.price = Math.max(1, firstItem.price + diff);
          }
        }
      }
    } else {
      // Fallback: 1 item tunggal dengan nilai penuh
      builtItems = [{
        name: 'Pesanan SEVAYA',
        price: finalGrandTotal,
        quantity: 1,
      }];
    }

    // Validasi akhir: pastikan sum == amount sebelum kirim ke TriPay
    const finalItemsTotal = builtItems.reduce((s, it) => s + it.price * it.quantity, 0);
    if (finalItemsTotal !== finalGrandTotal) {
      // Paksa cocok dengan menyesuaikan item pertama
      const firstItem = builtItems[0];
      if (firstItem) {
        firstItem.price += (finalGrandTotal - finalItemsTotal);
      }
    }

    const tripayResult = await createTripayTransaction({
      merchant_ref: order_id,
      method: tripayChannel,
      amount: finalGrandTotal,
      customer_name: customerFullName,
      customer_email: finalCustomer?.email || 'customer@sevaya.id',
      customer_phone: finalCustomer?.phone || '',
      order_items: builtItems,
    });

    console.log(`[TriPay Transaction] Order: ${order_id}, Channel: ${tripayChannel}, URL: ${tripayResult.payment_url}`);

    return NextResponse.json({
      success: true,
      gateway: 'tripay',
      payment_url: tripayResult.payment_url,
      reference: tripayResult.reference,
      gross_amount: finalGrandTotal,
    });

  } catch (err: any) {
    console.error('[snap-token error]:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Gagal membuat sesi pembayaran' },
      { status: 500 },
    );
  }
}
