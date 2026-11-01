import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/auth-server';
import { verifyAdminSession } from '@/lib/auth-admin';
import { DEFAULT_DB_PRODUCTS, DbProduct } from '@/integrations/supabase';

export const runtime = 'nodejs';

const PRODUCTS_FILE = 'products.json';

/**
 * GET /api/products
 * Returns the current products list from Supabase Storage (publicly accessible).
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from('catalog')
      .download(PRODUCTS_FILE);

    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text) as DbProduct[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return NextResponse.json(
          { success: true, products: parsed },
          { headers: { 'Cache-Control': 'no-store, max-age=0' } }
        );
      }
    }

    return NextResponse.json(
      { success: true, products: DEFAULT_DB_PRODUCTS },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { success: true, products: DEFAULT_DB_PRODUCTS, warning: message },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}

/**
 * POST /api/products
 * Saves / updates the products list in Supabase Storage using privileged Service Role Key.
 * Supports Admin session via HTTP-Only cookie, Authorization header, or admin query flag.
 */
export async function POST(req: NextRequest) {
  try {
    const session = verifyAdminSession(req);
    // Jika tidak ada session tapi ada secret header atau bypass di localhost/dev
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

    return NextResponse.json({ success: true, products });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
