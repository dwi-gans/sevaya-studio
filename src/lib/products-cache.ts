/**
 * Shared singleton cache for the /api/products route.
 * Both `inventory-server.ts` and `api/products/route.ts` import from here
 * so they always share the same in-memory state.
 */
import { DbProduct } from '@/integrations/supabase/products';

interface ProductsCacheState {
  products: DbProduct[] | null;
  timestamp: number;
}

// Attached to globalThis to survive hot-reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var __sevayaProductsCache: ProductsCacheState | undefined;
}

if (!globalThis.__sevayaProductsCache) {
  globalThis.__sevayaProductsCache = { products: null, timestamp: 0 };
}

export const productsCache = globalThis.__sevayaProductsCache;

export const PRODUCTS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 menit

export function setCachedProducts(products: DbProduct[]) {
  productsCache.products = products;
  productsCache.timestamp = Date.now();
}

export function invalidateCachedProducts() {
  productsCache.products = null;
  productsCache.timestamp = 0;
}

export function getCachedProducts(): { products: DbProduct[] | null; expired: boolean } {
  const now = Date.now();
  return {
    products: productsCache.products,
    expired: !productsCache.products || now - productsCache.timestamp >= PRODUCTS_CACHE_TTL_MS,
  };
}
