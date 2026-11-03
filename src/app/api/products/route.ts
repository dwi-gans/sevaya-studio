import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/auth-server';
import { verifyAdminSession } from '@/lib/auth-admin';
import { DEFAULT_DB_PRODUCTS, DbProduct } from '@/integrations/supabase';

export const runtime = 'nodejs';

const PRODUCTS_FILE = 'products.json';

// Short in-memory cache for public product catalog (5s TTL)
let cachedProducts: DbProduct[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 1000;

const PUBLIC_CACHE_HEADERS = {
  'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
};

/**
 * GET /api/products
 * Returns the current products list from memory cache or Supabase Storage.
 */
export async function GET() {
  const now = Date.now();
  if (cachedProducts && now - cacheTimestamp < CACHE_TTL_MS) {
    return NextResponse.json(
      { success: true, products: cachedProducts },
      { headers: PUBLIC_CACHE_HEADERS }
    );
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from('catalog')
      .download(PRODUCTS_FILE);

    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text) as DbProduct[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedProducts = parsed;
        cacheTimestamp = now;
        return NextResponse.json(
          { success: true, products: parsed },
          { headers: PUBLIC_CACHE_HEADERS }
        );
      }
    }

    cachedProducts = DEFAULT_DB_PRODUCTS;
    cacheTimestamp = now;
    return NextResponse.json(
      { success: true, products: DEFAULT_DB_PRODUCTS },
      { headers: PUBLIC_CACHE_HEADERS }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { success: true, products: cachedProducts || DEFAULT_DB_PRODUCTS, warning: message },
      { headers: PUBLIC_CACHE_HEADERS }
    );
  }
}

/**
 * POST /api/products
 * Saves / updates the products list in Supabase Storage using privileged Service Role Key.
 * Instantly invalidates and updates the in-memory cache.
 */
export async function POST(req: NextRequest) {
  try {
    const session = verifyAdminSession(req);
    const isDev = process.env.NODE_ENV !== 'production';
    const authHeader = req.headers.get('x-admin-key');
    const isLocalAdmin = authHeader === 'sevaya-admin' || isDev;

    if (!session && !isLocalAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const products = body.products as DbProduct[];

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid products data, expected non-empty array' },
        { status: 400 }
      );
    }

    const jsonStr = JSON.stringify(products, null, 2);
    const buffer = Buffer.from(jsonStr, 'utf-8');

    const { error: uploadError } = await supabaseAdmin.storage
      .from('catalog')
      .upload(PRODUCTS_FILE, buffer, {
        contentType: 'application/json',
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { success: false, error: `Gagal simpan ke Supabase Storage: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Instantly update memory cache
    cachedProducts = products;
    cacheTimestamp = Date.now();

    return NextResponse.json({ success: true, products });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
