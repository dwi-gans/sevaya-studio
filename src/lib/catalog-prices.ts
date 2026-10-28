import { createClient } from '@supabase/supabase-js';
import { DEFAULT_DB_PRODUCTS } from '@/integrations/supabase/products';
import { SEARCH_CATALOG } from '@/data/searchCatalog';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// In-memory catalog price map for instant fallback
const CATALOG_PRICE_MAP = new Map<string, number>();

// Populate static catalog prices
DEFAULT_DB_PRODUCTS.forEach((p) => {
  if (p.slug && p.price) {
    CATALOG_PRICE_MAP.set(p.slug.toLowerCase(), Number(p.price));
  }
});

SEARCH_CATALOG.forEach((item) => {
  if (item.slug && item.price) {
    CATALOG_PRICE_MAP.set(item.slug.toLowerCase(), Number(item.price));
  }
});

/**
 * Validates and retrieves the verified unit price of a product.
 * Checks Supabase database first, then fallback to catalog mapping.
 */
export async function getVerifiedProductPrice(productIdOrSlug: string, fallbackPrice?: number): Promise<number> {
  const cleanedId = String(productIdOrSlug || '').trim().toLowerCase();
  
  // Extract slug from compound IDs (e.g., "fina-abaya-1-Black-All Size-Top Notch" -> "fina-abaya-1")
  let slug = cleanedId;
  for (const knownSlug of CATALOG_PRICE_MAP.keys()) {
    if (cleanedId.startsWith(knownSlug)) {
      slug = knownSlug;
      break;
    }
  }

  // 1. Try DB lookup
  try {
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('price')
      .or(`slug.eq.${slug},slug.eq.${cleanedId}`)
      .maybeSingle();

    if (product && typeof product.price === 'number' && product.price > 0) {
      return product.price;
    }
  } catch {
    // Non-fatal, proceed to catalog map
  }

  // 2. Try catalog map
  if (CATALOG_PRICE_MAP.has(slug)) {
    return CATALOG_PRICE_MAP.get(slug)!;
  }
  if (CATALOG_PRICE_MAP.has(cleanedId)) {
    return CATALOG_PRICE_MAP.get(cleanedId)!;
  }

  // 3. Fallback: if caller provided a reasonable positive price (> Rp 50.000)
  if (typeof fallbackPrice === 'number' && fallbackPrice >= 50000) {
    return Math.round(fallbackPrice);
  }

  // Default abaya tier fallback
  return 1339000;
}
