import { NextRequest, NextResponse } from 'next/server';
import { getBiteshipRates } from '@/integrations/biteship';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit('ship_' + clientIp, 30, 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json({ success: false, error: 'Terlalu banyak permintaan kalkulasi ongkir.' }, { status: 429 });
    }
    const body = await request.json();
    const {
      destination_area_id,
      destination_postal_code,
      destination, // fallback if caller passes string id
      weight = 1000,
      couriers,
      items,
    } = body;

    const areaId =
      destination_area_id ||
      (typeof destination === 'string' && destination.startsWith('IDN') ? destination : undefined);
    const postalCode =
      destination_postal_code || (typeof destination === 'number' ? destination : undefined);

    const { rates, notice } = await getBiteshipRates({
      destination_area_id: areaId,
      destination_postal_code: postalCode,
      couriers: couriers || 'jne,sicepat,jnt,anteraja,tiki,pos,gojek,grab',
      items: items || [
        {
          name: 'The Obsidian Abaya - Silk Noir',
          description: 'Luxury modest wear garment',
          category: 'fashion',
          value: 350000,
          quantity: 1,
          weight: Number(weight) || 1000,
        },
      ],
    });

    return NextResponse.json({ success: true, data: rates, notice });
  } catch (error) {
    console.error('API /api/shipping/calculate (Biteship) error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal Server Error',
      },
      { status: 500 },
    );
  }
}
