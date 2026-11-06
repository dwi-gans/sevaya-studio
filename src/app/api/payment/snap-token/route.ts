import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/auth-server';
import { createTripayTransaction } from '@/integrations/tripay';

export async function POST(req: NextRequest) {
  try {
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

    // Ambil data order dari DB untuk pastikan harga tidak bisa dimanipulasi client
    let finalGrandTotal = Number(clientGrandTotal) || 0;
    let finalItems = clientItems;
    let finalCustomer = clientCustomer;

    try {
      const { data: dbOrder } = await supabaseAdmin
        .from('orders')
        .select('grand_total, items, customer_name, customer_email, customer_phone')
        .eq('order_number', order_id)
        .maybeSingle();

      if (dbOrder && typeof dbOrder.grand_total === 'number' && dbOrder.grand_total > 0) {
        finalGrandTotal = Math.round(dbOrder.grand_total);

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

    // Mapping payment_method → TriPay channel code
    const tripayChannelMap: Record<string, string> = {
      va_bri:            'BRIVA',
      va_bni:            'BNIVA',
      va_bsi:            'BSIVA',
      va_mandiri:        'MANDIRIVA',
      va_other:          'BCAVA',
      retail_alfamart:   'ALFAMART',
      retail_indomaret:  'INDOMARET',
    };

    const tripayChannel = tripayChannelMap[payment_method] || 'BRIVA';

    const customerFullName =
      [finalCustomer?.first_name, finalCustomer?.last_name].filter(Boolean).join(' ') ||
      'Pelanggan SEVAYA';

    const tripayResult = await createTripayTransaction({
      merchant_ref: order_id,
      method: tripayChannel,
      amount: finalGrandTotal,
      customer_name: customerFullName,
      customer_email: finalCustomer?.email || 'customer@sevaya.id',
      customer_phone: finalCustomer?.phone || '',
      order_items: (finalItems || []).map((it: any) => ({
        name: it.name || it.title || 'Produk SEVAYA',
        price: Math.round(Number(it.price) || finalGrandTotal),
        quantity: Math.max(1, Math.round(Number(it.quantity) || 1)),
      })),
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
