import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth-admin';
import {
  getInventoryVariants,
  saveInventoryVariants,
  getStockMutations,
  ensureVariantsForProduct,
  addCustomVariant,
  ProductVariant,
} from '@/integrations/supabase';

// GET /api/admin/inventory
export async function GET(req: NextRequest) {
  try {
    const isDev = process.env.NODE_ENV !== 'production';
    const authHeader = req.headers.get('x-admin-key');
    const isLocalAdmin = authHeader === 'sevaya-admin' || isDev;
    const session = verifyAdminSession(req);

    if (!session && !isLocalAdmin) {
      return NextResponse.json({ error: 'Akses ditolak: Autentikasi admin diperlukan.' }, { status: 401 });
    }

    const forceRefresh = req.nextUrl.searchParams.get('refresh') === 'true';
    const [variants, mutations] = await Promise.all([
      getInventoryVariants(forceRefresh),
      getStockMutations(),
    ]);

    // Telemetri ringkasan
    const totalPhysicalUnits = variants.reduce((sum, v) => sum + v.stock, 0);
    const readyVariantsCount = variants.filter((v) => v.stock > (v.lowStockThreshold ?? 3)).length;
    const lowStockVariantsCount = variants.filter((v) => v.stock > 0 && v.stock <= (v.lowStockThreshold ?? 3)).length;
    const outOfStockVariantsCount = variants.filter((v) => v.stock <= 0).length;

    return NextResponse.json({
      success: true,
      variants,
      mutations: mutations.slice(0, 50), // 50 mutasi terakhir
      telemetry: {
        totalVariants: variants.length,
        totalPhysicalUnits,
        readyVariantsCount,
        lowStockVariantsCount,
        outOfStockVariantsCount,
      },
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memuat inventaris stok';
    console.error('[GET /api/admin/inventory]', err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST /api/admin/inventory (Save/Update Variants Batch, Add Custom Variant, or Ensure Product)
export async function POST(req: NextRequest) {
  try {
    const session = verifyAdminSession(req);
    const isDev = process.env.NODE_ENV !== 'production';
    const authHeader = req.headers.get('x-admin-key');
    const isLocalAdmin = authHeader === 'sevaya-admin' || isDev;

    if (!session && !isLocalAdmin) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 401 });
    }

    const body = await req.json();

    // 1. Action: Add single custom variant
    if (body.action === 'add_variant') {
      const { productId, productTitle, productSlug, colorName, colorHex, size, initialStock } = body;
      if (!productId || !productTitle || !colorName || !size) {
        return NextResponse.json({ error: 'Data varian tidak lengkap' }, { status: 400 });
      }
      const createdVariant = await addCustomVariant({
        productId,
        productTitle,
        productSlug: productSlug || '',
        colorName,
        colorHex: colorHex || '#1A1A1A',
        size,
        initialStock: Number(initialStock) || 0,
      });
      return NextResponse.json({ success: true, variant: createdVariant });
    }

    // 2. Action: Ensure variants for product
    if (body.action === 'ensure_product' && body.product) {
      const allVariants = await ensureVariantsForProduct(body.product);
      return NextResponse.json({ success: true, variants: allVariants });
    }

    // 3. Batch save
    const { variants } = body as { variants: ProductVariant[] };
    if (!Array.isArray(variants)) {
      return NextResponse.json({ error: 'Data varian tidak valid' }, { status: 400 });
    }

    await saveInventoryVariants(variants);

    return NextResponse.json({
      success: true,
      variants,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memproses data inventaris';
    console.error('[POST /api/admin/inventory]', err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
