import { NextRequest, NextResponse } from 'next/server';
import { searchBiteshipAreas } from '@/integrations/biteship';

export async function GET(request: NextRequest) {
  try {
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
