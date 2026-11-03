import { NextRequest, NextResponse } from 'next/server';
import { searchBiteshipAreas } from '@/integrations/biteship';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// In-memory cache for destination autocomplete (1 hour TTL)
interface DestinationCacheEntry {
  data: any[];
  expiresAt: number;
}
const destinationCache = new Map<string, DestinationCacheEntry>();

export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit('dest_' + clientIp, 60, 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json({ success: false, error: 'Terlalu banyak pencarian wilayah.' }, { status: 429 });
    }
    const searchParams = request.nextUrl.searchParams;
    const query = (searchParams.get('search') || '').trim().toLowerCase();

    if (query.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Check memory cache
    const now = Date.now();
    const cached = destinationCache.get(query);
    if (cached && cached.expiresAt > now) {
      return NextResponse.json(
        { success: true, data: cached.data },
        { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
      );
    }

    const areas = await searchBiteshipAreas(query);

    // Save to cache (1 hour)
    destinationCache.set(query, {
      data: areas,
      expiresAt: now + 60 * 60 * 1000,
    });

    // Evict oldest if map grows large
    if (destinationCache.size > 500) {
      for (const [key, entry] of destinationCache.entries()) {
        if (entry.expiresAt <= now) destinationCache.delete(key);
      }
    }

    return NextResponse.json(
      { success: true, data: areas },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
    );
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
