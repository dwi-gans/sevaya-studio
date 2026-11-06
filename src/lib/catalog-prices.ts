import { createClient } from '@supabase/supabase-js';
import { DEFAULT_DB_PRODUCTS } from '@/integrations/supabase/products';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Module-level cache for Storage prices (refreshed every 60 seconds)
let storagePriceCache: Map<string, number> | null = null;
let storageCacheTimestamp = 0;
const STORAGE_CACHE_TTL_MS = 60 * 1000;

// Static fallback price map from DEFAULT_DB_PRODUCTS (always up-to-date in code)
const STATIC_PRICE_MAP = new Map<string, number>();
DEFAULT_DB_PRODUCTS.forEach((p) => {
  if (p.slug && p.price) {
    STATIC_PRICE_MAP.set(p.slug.toLowerCase(), Number(p.price));
  }
});

/**
 * Loads live product prices from Supabase Storage (catalog/products.json).
 * Results are cached for 60 seconds to avoid excessive API calls.
 */
async function getStoragePriceMap(): Promise<Map<string, number>> {
  const now = Date.now();
  if (storagePriceCache && now - storageCacheTimestamp < STORAGE_CACHE_TTL_MS) {
    return storagePriceCache;
  }

  try {
    const { data, error } = await supabaseAdmin.storage.from('catalog').download('products.json');
    if (!error && data) {
      const text = await data.text();
      const products: Array<{ slug?: string; id?: string; price?: number }> = JSON.parse(text);
      const map = new Map<string, number>();
      for (const p of products) {
        const key = (p.slug || p.id || '').toLowerCase();
        const price = Number(p.price);
        if (key && price > 0) {
          map.set(key, price);
        }
      }
      storagePriceCache = map;
      storageCacheTimestamp = now;
      return map;
    }
  } catch {
    // Non-fatal — use previous cache or static map
  }

  // Return old cache if available, otherwise static map
  return storagePriceCache ?? STATIC_PRICE_MAP;
}

/**
 * Validates and retrieves the verified unit price of a product.
 * Priority: Supabase Storage JSON → Static DEFAULT_DB_PRODUCTS map → client-provided price
 */
export async function getVerifiedProductPrice(productIdOrSlug: string, fallbackPrice?: number): Promise<number> {
  const cleanedId = String(productIdOrSlug || '').trim().toLowerCase();

  // 1. Load live prices from Supabase Storage
  const priceMap = await getStoragePriceMap();

  // Extract slug from compound IDs (e.g., "fina-abaya-1-Black-All Size-Top Notch" -> "fina-abaya-1")
  let slug = cleanedId;
  for (const knownSlug of priceMap.keys()) {
    if (cleanedId.startsWith(knownSlug)) {
      slug = knownSlug;
      break;
    }
  }
  // Also try static map for slug extraction in case storage is stale
  if (slug === cleanedId) {
    for (const knownSlug of STATIC_PRICE_MAP.keys()) {
      if (cleanedId.startsWith(knownSlug)) {
        slug = knownSlug;
        break;
      }
    }
  }

  // 2. Look up in live storage price map
  if (priceMap.has(slug)) return priceMap.get(slug)!;
  if (priceMap.has(cleanedId)) return priceMap.get(cleanedId)!;

  // 3. Try Supabase DB table (may not exist — non-fatal)
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
    // Table may not exist — non-fatal
  }

  // 4. Static fallback map
  if (STATIC_PRICE_MAP.has(slug)) return STATIC_PRICE_MAP.get(slug)!;
  if (STATIC_PRICE_MAP.has(cleanedId)) return STATIC_PRICE_MAP.get(cleanedId)!;

  // 5. Use client-provided price only if it meets catalog minimum threshold (>= Rp 450.000)
  if (typeof fallbackPrice === 'number' && fallbackPrice >= 450000) {
    return Math.round(fallbackPrice);
  }

  // 6. Last-resort default (SEVAYA signature abaya price)
  return 1339000;
}
