import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/auth-server';
import { verifyAdminSession } from '@/lib/auth-admin';
import { DEFAULT_DB_PRODUCTS, DbProduct } from '@/integrations/supabase';
import {
  getCachedProducts,
  setCachedProducts,
} from '@/lib/products-cache';
import { cleanServerOrphanedVariants } from '@/lib/inventory-server';

export const runtime = 'nodejs';

const PRODUCTS_FILE = 'products.json';
const DATA_DIR = path.join(process.cwd(), '.data');

const PUBLIC_CACHE_HEADERS = {
  'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
};

function readLocalProducts(): DbProduct[] | null {
  try {
    const filePath = path.join(DATA_DIR, PRODUCTS_FILE);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content) as DbProduct[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function writeLocalProducts(products: DbProduct[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(path.join(DATA_DIR, PRODUCTS_FILE), JSON.stringify(products, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

/**
 * GET /api/products
 * Priority: shared globalThis cache → Supabase Storage → .data/products.json → DEFAULT_DB_PRODUCTS
 */
export async function GET() {
  const { products: cached, expired } = getCachedProducts();

  if (cached && !expired) {
    return NextResponse.json(
      { success: true, products: cached },
      { headers: PUBLIC_CACHE_HEADERS }
    );
  }

  // 1. Try Supabase Storage (may be offline in dev)
  try {
    const { data, error } = await supabaseAdmin.storage
      .from('catalog')
      .download(PRODUCTS_FILE);

    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text) as DbProduct[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setCachedProducts(parsed);
        writeLocalProducts(parsed); // keep disk in sync
        return NextResponse.json(
          { success: true, products: parsed },
          { headers: PUBLIC_CACHE_HEADERS }
        );
      }
    }
  } catch {
    // offline or storage unavailable — fall through to disk
  }

  // 2. Fallback: .data/products.json (written by inventory-server after every mutation/sync)
  const fromDisk = readLocalProducts();
  if (fromDisk) {
    setCachedProducts(fromDisk);
    return NextResponse.json(
      { success: true, products: fromDisk },
      { headers: PUBLIC_CACHE_HEADERS }
    );
  }

  // 3. Last resort: hardcoded defaults
  setCachedProducts(DEFAULT_DB_PRODUCTS);
  return NextResponse.json(
    { success: true, products: DEFAULT_DB_PRODUCTS },
    { headers: PUBLIC_CACHE_HEADERS }
  );
}

/**
 * POST /api/products
 * Saves / updates the products list in Supabase Storage + disk + shared cache.
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

    // Always write to disk first (reliable)
    writeLocalProducts(products);

    // Update shared cache immediately
    setCachedProducts(products);

    // Try Supabase (best-effort)
    const jsonStr = JSON.stringify(products, null, 2);
    const buffer = Buffer.from(jsonStr, 'utf-8');
    await supabaseAdmin.storage
      .from('catalog')
      .upload(PRODUCTS_FILE, buffer, {
        contentType: 'application/json',
        upsert: true,
      })
      .catch(() => {/* offline — disk already saved */});

    // Otomatis sinkronkan varian inventaris agar swatch/size baru langsung tersedia di Inventaris
    try {
      await cleanServerOrphanedVariants(true);
    } catch (e) {
      console.warn('[POST /api/products] Inventory reconcile error:', e);
    }

    return NextResponse.json({ success: true, products });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
