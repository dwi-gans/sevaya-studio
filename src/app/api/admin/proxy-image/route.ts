import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get('url');
  if (!urlParam) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const parsedUrl = new URL(urlParam);
    // Allow fetching from Supabase or local assets
    const res = await fetch(parsedUrl.toString(), {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Sevaya-Admin-ImageProxy/1.0',
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${res.statusText}` },
        { status: res.status }
      );
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Proxy fetch failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
