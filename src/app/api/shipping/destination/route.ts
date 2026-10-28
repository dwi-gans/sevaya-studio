import { NextRequest, NextResponse } from 'next/server';
import { searchBiteshipAreas } from '@/integrations/biteship';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit('dest_' + clientIp, 60, 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json({ success: false, error: 'Terlalu banyak pencarian wilayah.' }, { status: 429 });
    }
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('search') || '';

    if (query.trim().length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    const areas = await searchBiteshipAreas(query);
    return NextResponse.json({ success: true, data: areas });
  } catch (error) {
    console.error('API /api/shipping/destination (Biteship) error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal Server Error',
      },
      { status: 500 },
    );
  }
}
