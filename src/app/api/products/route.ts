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
        return NextResponse.json({ success: true, products: parsed });
      }
    }

    return NextResponse.json({ success: true, products: DEFAULT_DB_PRODUCTS });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: true, products: DEFAULT_DB_PRODUCTS, warning: message });
  }
}

/**
 * POST /api/products
 * Saves / updates the products list in Supabase Storage using privileged Service Role Key.
 * Admin authenticated only.
 */
export async function POST(req: NextRequest) {
  try {
    const session = verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const products = body.products as DbProduct[];

    if (!Array.isArray(products)) {
      return NextResponse.json(
        { success: false, error: 'Invalid products data, expected array' },
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
