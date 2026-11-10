import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '@/lib/auth-server';
import {
  ProductVariant,
  StockMutation,
  MutationType,
  MutationReason,
  generateVariantSku,
  generateDefaultVariantsForProduct,
} from '@/integrations/supabase/inventory';
import { DbProduct, DEFAULT_DB_PRODUCTS } from '@/integrations/supabase/products';
import { setCachedProducts, getCachedProducts, invalidateCachedProducts } from '@/lib/products-cache';

const INVENTORY_FILE = 'inventory.json';
const MUTATIONS_FILE = 'stock_mutations.json';
const PRODUCTS_FILE = 'products.json';

// Local storage backup directory (in dev or when Supabase storage is offline)
const DATA_DIR = path.join(process.cwd(), '.data');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    // ignore
  }
}

function readLocalFile<T>(filename: string): T | null {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as T;
    }
  } catch {
    // ignore
  }
  return null;
}

function writeLocalFile(filename: string, data: unknown) {
  try {
    ensureDataDir();
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

async function downloadFromStorage<T>(filename: string): Promise<T | null> {
  try {
    // 1. Direct REST fetch with cache-busting timestamp & no-store headers to guarantee bypass of Cloudflare CDN
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceKey) {
      try {
        const bustUrl = `${supabaseUrl}/storage/v1/object/catalog/${filename}?t=${Date.now()}`;
        const res = await fetch(bustUrl, {
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            'Cache-Control': 'no-cache, no-store, max-age=0',
            Pragma: 'no-cache',
          },
          cache: 'no-store',
        });
        if (res.ok) {
          const text = await res.text();
          if (text) {
            return JSON.parse(text) as T;
          }
        }
      } catch {
        // Fall back to standard download
      }
    }

    const { data, error } = await supabaseAdmin.storage
      .from('catalog')
      .download(filename);
    if (error) {
      console.error(`[Storage] Download "${filename}" error:`, error.message);
      return null;
    }
    if (data) {
      const text = await data.text();
      const parsed = JSON.parse(text) as T;
      return parsed;
    }
  } catch (err) {
    console.error(`[Storage] Download "${filename}" exception:`, err);
  }
  return null;
}

async function uploadToStorage(filename: string, data: unknown): Promise<boolean> {
  try {
    const buffer = Buffer.from(JSON.stringify(data, null, 2), 'utf-8');
    const { error } = await supabaseAdmin.storage
      .from('catalog')
      .upload(filename, buffer, {
        contentType: 'application/json',
        upsert: true,
        cacheControl: '0',
      });
    if (error) {
      console.error(`[Storage] Upload "${filename}" error:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[Storage] Upload "${filename}" exception:`, err);
    return false;
  }
}

// In-memory caches — survive hot-reload in dev with globalThis trick
declare global {
  // eslint-disable-next-line no-var
  var __sevayaInventoryCache: {
    variants: ProductVariant[] | null;
    mutations: StockMutation[] | null;
    variantTs: number;
  } | undefined;
}

if (!globalThis.__sevayaInventoryCache) {
  globalThis.__sevayaInventoryCache = { variants: null, mutations: null, variantTs: 0 };
}

// TTL: 60 detik — cukup fresh untuk UX real-time, cukup panjang untuk performa
const INVENTORY_CACHE_TTL_MS = 60 * 1000;

function isCacheStale(): boolean {
  const ts = globalThis.__sevayaInventoryCache?.variantTs ?? 0;
  return Date.now() - ts >= INVENTORY_CACHE_TTL_MS;
}

/** Invalidate cache in-memory agar request berikutnya ambil fresh dari Supabase Storage */
export function invalidateServerInventoryCache() {
  if (globalThis.__sevayaInventoryCache) {
    globalThis.__sevayaInventoryCache.variants = null;
    globalThis.__sevayaInventoryCache.mutations = null;
    globalThis.__sevayaInventoryCache.variantTs = 0;
  }
  _serverCachedVariants = null;
  _serverCachedMutations = null;
  invalidateCachedProducts();
}

export async function getServerProducts(forceRefresh = false): Promise<DbProduct[]> {
  if (forceRefresh) {
    invalidateCachedProducts();
  }
  const { products: cached, expired } = getCachedProducts();
  if (!forceRefresh && cached && !expired && cached.length > 0) {
    return cached;
  }

  // 1. Supabase Storage (source of truth — always preferred on Vercel)
  const fromStorage = await downloadFromStorage<DbProduct[]>(PRODUCTS_FILE);
  if (Array.isArray(fromStorage) && fromStorage.length > 0) {
    setCachedProducts(fromStorage);
    writeLocalFile(PRODUCTS_FILE, fromStorage);
    return fromStorage;
  }

  // 2. Disk fallback (dev/sandbox only — ephemeral on Vercel)
  const fromLocal = readLocalFile<DbProduct[]>(PRODUCTS_FILE);
  if (Array.isArray(fromLocal) && fromLocal.length > 0) {
    setCachedProducts(fromLocal);
    return fromLocal;
  }

  setCachedProducts(DEFAULT_DB_PRODUCTS);
  return DEFAULT_DB_PRODUCTS;
}

export async function saveServerProducts(products: DbProduct[]): Promise<void> {
  setCachedProducts(products);
  writeLocalFile(PRODUCTS_FILE, products);
  await uploadToStorage(PRODUCTS_FILE, products);
}

export async function getServerInventoryVariants(forceRefresh = false): Promise<ProductVariant[]> {
  const cache = globalThis.__sevayaInventoryCache!;

  // Return in-memory cache only if still fresh and not forced
  if (!forceRefresh && cache.variants && cache.variants.length > 0 && !isCacheStale()) {
    return cache.variants;
  }

  // 1. Supabase Storage (source of truth — selalu diutamakan agar data tidak stale di Vercel)
  const fromStorage = await downloadFromStorage<ProductVariant[]>(INVENTORY_FILE);
  if (Array.isArray(fromStorage) && fromStorage.length > 0) {
    cache.variants = fromStorage;
    cache.variantTs = Date.now();
    writeLocalFile(INVENTORY_FILE, fromStorage);
    return fromStorage;
  }

  // 2. Disk fallback (hanya dev/sandbox, ephemeral di Vercel)
  const fromLocal = readLocalFile<ProductVariant[]>(INVENTORY_FILE);
  if (Array.isArray(fromLocal) && fromLocal.length > 0) {
    cache.variants = fromLocal;
    cache.variantTs = Date.now();
    return fromLocal;
  }

  // 3. Last resort: generate default variants — JANGAN upload balik ke Storage
  //    karena bisa menimpa data stok yang sebenarnya ada (bug utama "stok habis saat refresh")
  console.warn('[getServerInventoryVariants] Storage dan disk kosong — generating default variants (stock=0). Pastikan SUPABASE_SERVICE_ROLE_KEY valid dan Storage bucket "catalog" dapat diakses.');
  const products = await getServerProducts(forceRefresh);
  const allVariants: ProductVariant[] = [];
  for (const p of products) {
    allVariants.push(...generateDefaultVariantsForProduct(p));
  }

  // Simpan ke cache in-memory saja (dengan TTL pendek 10 detik), jangan upload ke Storage
  cache.variants = allVariants;
  cache.variantTs = Date.now() - INVENTORY_CACHE_TTL_MS + 10_000; // expire dalam ~10 detik
  return allVariants;
}

export async function saveServerInventoryVariants(variants: ProductVariant[]): Promise<void> {
  const cache = globalThis.__sevayaInventoryCache!;
  cache.variants = variants;
  cache.variantTs = Date.now();
  writeLocalFile(INVENTORY_FILE, variants);
  await uploadToStorage(INVENTORY_FILE, variants);
}

export async function getServerStockMutations(forceRefresh = false): Promise<StockMutation[]> {
  const cache = globalThis.__sevayaInventoryCache!;
  if (!forceRefresh && cache.mutations && cache.mutations.length > 0) {
    return cache.mutations;
  }
  if (!forceRefresh && _serverCachedMutations && _serverCachedMutations.length > 0) {
    return _serverCachedMutations;
  }

  const fromStorage = await downloadFromStorage<StockMutation[]>(MUTATIONS_FILE);
  if (Array.isArray(fromStorage)) {
    cache.mutations = fromStorage;
    writeLocalFile(MUTATIONS_FILE, fromStorage);
    return fromStorage;
  }

  const fromLocal = readLocalFile<StockMutation[]>(MUTATIONS_FILE);
  if (Array.isArray(fromLocal)) {
    cache.mutations = fromLocal;
    return fromLocal;
  }

  return [];
}

export async function saveServerStockMutations(mutations: StockMutation[]): Promise<void> {
  const cache = globalThis.__sevayaInventoryCache!;
  cache.mutations = mutations;
  writeLocalFile(MUTATIONS_FILE, mutations);
  await uploadToStorage(MUTATIONS_FILE, mutations);
}

export async function executeServerStockMutation(params: {
  variantId: string;
  type: MutationType;
  quantity: number;
  reason: MutationReason;
  reference?: string;
  notes?: string;
  createdBy?: string;
}): Promise<{
  variant: ProductVariant;
  mutation: StockMutation;
  totalProductStock: number;
}> {
  const variants = await getServerInventoryVariants();
  const index = variants.findIndex((v) => v.id === params.variantId);

  if (index === -1) {
    throw new Error(`Varian dengan ID "${params.variantId}" tidak ditemukan.`);
  }

  const target = variants[index]!;
  const prevStock = target.stock;
  let newStock = prevStock;
  const qty = Math.abs(params.quantity);

  if (params.type === 'in') {
    if (qty <= 0) {
      throw new Error('Jumlah unit stok masuk harus lebih dari 0.');
    }
    newStock = prevStock + qty;
  } else if (params.type === 'out') {
    if (prevStock <= 0) {
      throw new Error(`Stok varian "${target.sku}" saat ini sudah kosong (0 pcs). Tidak ada unit yang dapat dikeluarkan.`);
    }
    if (qty <= 0) {
      throw new Error('Jumlah unit stok keluar harus lebih dari 0.');
    }
    if (qty > prevStock) {
      throw new Error(
        `Jumlah stok keluar (${qty} pcs) melebihi sisa stok yang tersedia (${prevStock} pcs). Maksimal unit yang dapat dikeluarkan adalah ${prevStock} pcs.`
      );
    }
    newStock = prevStock - qty;
  } else if (params.type === 'adjustment') {
    if (params.quantity < 0) {
      throw new Error('Stok fisik aktual tidak boleh bernilai negatif.');
    }
    newStock = Math.max(0, params.quantity);
  }

  const updatedVariant: ProductVariant = {
    ...target,
    stock: newStock,
    updatedAt: new Date().toISOString(),
  };

  variants[index] = updatedVariant;
  await saveServerInventoryVariants(variants);

  // Hitung total stok produk induk secara akurat dari akumulasi semua variannya
  const productVariants = variants.filter((v) => v.productId === target.productId);
  const totalProductStock = productVariants.reduce((sum, v) => sum + v.stock, 0);

  // Buat riwayat mutasi
  const mutation: StockMutation = {
    id: `mut-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    variantId: target.id,
    sku: target.sku,
    productTitle: target.productTitle,
    colorName: target.colorName,
    size: target.size,
    type: params.type,
    quantity: params.type === 'out' ? -qty : (params.type === 'adjustment' ? newStock - prevStock : qty),
    previousStock: prevStock,
    currentStock: newStock,
    reason: params.reason,
    reference: params.reference?.trim() || undefined,
    notes: params.notes?.trim() || undefined,
    createdBy: params.createdBy || 'Admin Studio',
    createdAt: new Date().toISOString(),
  };

  const existingMutations = await getServerStockMutations();
  await saveServerStockMutations([mutation, ...existingMutations]);

  // SINKRONKAN STOK PRODUK INDUK DI KATALOG
  try {
    const products = await getServerProducts();
    const prodIdx = products.findIndex((p) => String(p.id) === String(target.productId));
    const targetProd = products[prodIdx];
    if (targetProd) {
      products[prodIdx] = {
        ...targetProd,
        stock: totalProductStock,
        inStock: totalProductStock > 0,
      };
      await saveServerProducts(products);
    }

    // Update juga tabel Supabase PostgreSQL jika ada
    try {
      await supabaseAdmin
        .from('products')
        .update({
          stock: totalProductStock,
          inStock: totalProductStock > 0,
        })
        .eq('id', target.productId);
    } catch {
      // Table might not exist or use snake_case
    }
  } catch (syncErr) {
    console.warn('[executeServerStockMutation] Catalog sync warning:', syncErr);
  }

  return {
    variant: updatedVariant,
    mutation,
    totalProductStock,
  };
}

export async function ensureServerVariantsForProduct(product: DbProduct): Promise<ProductVariant[]> {
  const existing = await getServerInventoryVariants();
  const swatches = product.swatches && product.swatches.length > 0
    ? product.swatches
    : [{ name: 'Default', color: '#1A1A1A' }];
  const sizes = product.sizes && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L'];

  let changed = false;

  // 1. Hapus varian lama HANYA jika produk / warna / ukuran benar-benar dihapus dari katalog produk
  let updatedList = existing.filter((v) => {
    if (String(v.productId).trim() !== String(product.id).trim()) {
      return true;
    }
    const vColorNorm = v.colorName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isColorValid = swatches.some((s) => {
      const sNorm = s.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return s.name.trim().toLowerCase() === v.colorName.trim().toLowerCase() || sNorm === vColorNorm;
    });

    const vSizeNorm = v.size.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isSizeValid = sizes.some((sz) => {
      const szNorm = sz.toLowerCase().replace(/[^a-z0-9]/g, '');
      return sz.trim().toLowerCase() === v.size.trim().toLowerCase() || szNorm === vSizeNorm;
    });

    if (!isColorValid || !isSizeValid) {
      changed = true;
      return false; // Hapus varian ini dari inventaris
    }
    return true;
  });

  // 2. Pastikan setiap varian kombinasi aktif (swatch x size) sudah tersedia
  for (const sw of swatches) {
    const swNorm = sw.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const sz of sizes) {
      const szNorm = sz.toLowerCase().replace(/[^a-z0-9]/g, '');
      const variantId = `${product.id}-${sw.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${sz.toLowerCase()}`;
      const foundIdx = updatedList.findIndex((v) => {
        if (v.id === variantId) return true;
        if (String(v.productId).trim() === String(product.id).trim()) {
          const vColorNorm = v.colorName.toLowerCase().replace(/[^a-z0-9]/g, '');
          const vSizeNorm = v.size.toLowerCase().replace(/[^a-z0-9]/g, '');
          return (
            (v.colorName.toLowerCase().trim() === sw.name.toLowerCase().trim() || vColorNorm === swNorm) &&
            (v.size.toLowerCase().trim() === sz.toLowerCase().trim() || vSizeNorm === szNorm)
          );
        }
        return false;
      });

      if (foundIdx === -1) {
        const sku = generateVariantSku(product.title, product.id, sw.name, sz);
        updatedList.push({
          id: variantId,
          productId: String(product.id),
          productSlug: product.slug,
          productTitle: product.title,
          sku,
          colorName: sw.name,
          colorHex: sw.color || '#1A1A1A',
          size: sz,
          stock: 0,
          lowStockThreshold: 3,
          updatedAt: new Date().toISOString(),
        });
        changed = true;
      } else {
        const curr = updatedList[foundIdx]!;
        if (
          curr.productTitle !== product.title ||
          curr.productSlug !== product.slug ||
          (sw.color && curr.colorHex !== sw.color) ||
          curr.colorName !== sw.name ||
          curr.size !== sz
        ) {
          updatedList[foundIdx] = {
            ...curr,
            productTitle: product.title,
            productSlug: product.slug,
            colorName: sw.name,
            colorHex: sw.color || curr.colorHex,
            size: sz,
            updatedAt: new Date().toISOString(),
          };
          changed = true;
        }
      }
    }
  }

  if (changed) {
    await saveServerInventoryVariants(updatedList);
  }

  // Sinkronkan total stok ke katalog produk
  const productVariants = updatedList.filter((v) => String(v.productId).trim() === String(product.id).trim());
  const totalStock = productVariants.reduce((sum, v) => sum + v.stock, 0);
  try {
    const products = await getServerProducts();
    const pIdx = products.findIndex((p) => String(p.id) === String(product.id));
    const targetProd = products[pIdx];
    if (targetProd) {
      products[pIdx] = {
        ...targetProd,
        title: product.title || targetProd.title,
        slug: product.slug || targetProd.slug,
        description: product.description !== undefined ? product.description : targetProd.description,
        fabric: product.fabric !== undefined ? product.fabric : targetProd.fabric,
        sizing: product.sizing !== undefined ? product.sizing : targetProd.sizing,
        stock: totalStock,
        inStock: totalStock > 0,
      };
      await saveServerProducts(products);
    }
  } catch {
    // ignore
  }

  return updatedList;
}

/**
 * Sinkronisasi dua arah otomatis antara katalog produk dan inventaris stok:
 * 1. Membersihkan varian yatim (warna / ukuran / produk yang dihapus dari katalog)
 * 2. Meng-generate otomatis varian baru yang belum ada untuk setiap swatch x size dari produk katalog
 * 3. Menjaga stok yang sudah ada agar tidak pernah terhapus atau reset ke 0
 */
export async function cleanServerOrphanedVariants(forceRefresh = false): Promise<ProductVariant[]> {
  const [products, variants] = await Promise.all([
    getServerProducts(forceRefresh),
    getServerInventoryVariants(forceRefresh),
  ]);

  const productMap = new Map<string, DbProduct>();
  products.forEach((p) => {
    productMap.set(String(p.id).trim(), p);
  });

  let changed = false;

  // 1. Hapus varian yang produk atau warna atau ukurannya sudah dihapus dari katalog
  let cleaned = variants.filter((v) => {
    const parent = productMap.get(String(v.productId).trim());
    if (!parent) {
      changed = true;
      return false; // Produk induk sudah dihapus
    }

    if (parent.swatches && parent.swatches.length > 0) {
      const vColorNorm = v.colorName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const colorValid = parent.swatches.some((s) => {
        const sNorm = s.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return s.name.trim().toLowerCase() === v.colorName.trim().toLowerCase() || sNorm === vColorNorm;
      });
      if (!colorValid) {
        changed = true;
        return false; // Warna sudah dihapus dari katalog
      }
    }

    if (parent.sizes && parent.sizes.length > 0) {
      const vSizeNorm = v.size.toLowerCase().replace(/[^a-z0-9]/g, '');
      const sizeValid = parent.sizes.some((sz) => {
        const szNorm = sz.toLowerCase().replace(/[^a-z0-9]/g, '');
        return sz.trim().toLowerCase() === v.size.trim().toLowerCase() || szNorm === vSizeNorm;
      });
      if (!sizeValid) {
        changed = true;
        return false; // Ukuran sudah dihapus dari katalog
      }
    }

    return true;
  });

  // 2. JAMIN SETIAP KOMBINASI WARNA x UKURAN DARI SEMUA PRODUK AKTIF MEMILIKI BARIS VARIAN
  for (const product of products) {
    const swatches = product.swatches && product.swatches.length > 0
      ? product.swatches
      : [{ name: 'Default', color: '#1A1A1A' }];
    const sizes = product.sizes && product.sizes.length > 0 ? product.sizes : ['All Size'];

    for (const sw of swatches) {
      const swNorm = sw.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const sz of sizes) {
        const szNorm = sz.toLowerCase().replace(/[^a-z0-9]/g, '');
        const variantId = `${product.id}-${sw.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${sz.toLowerCase()}`;
        const foundIdx = cleaned.findIndex((v) => {
          if (v.id === variantId) return true;
          if (String(v.productId).trim() === String(product.id).trim()) {
            const vColorNorm = v.colorName.toLowerCase().replace(/[^a-z0-9]/g, '');
            const vSizeNorm = v.size.toLowerCase().replace(/[^a-z0-9]/g, '');
            return (
              (v.colorName.toLowerCase().trim() === sw.name.toLowerCase().trim() || vColorNorm === swNorm) &&
              (v.size.toLowerCase().trim() === sz.toLowerCase().trim() || vSizeNorm === szNorm)
            );
          }
          return false;
        });

        if (foundIdx === -1) {
          const sku = generateVariantSku(product.title, product.id, sw.name, sz);
          cleaned.push({
            id: variantId,
            productId: String(product.id),
            productSlug: product.slug,
            productTitle: product.title,
            sku,
            colorName: sw.name,
            colorHex: sw.color || '#1A1A1A',
            size: sz,
            stock: 0,
            lowStockThreshold: 3,
            updatedAt: new Date().toISOString(),
          });
          changed = true;
        } else {
          // Update metadata jika judul produk, slug, warna hex, atau nama warna/ukuran diperbarui
          const curr = cleaned[foundIdx]!;
          if (
            curr.productTitle !== product.title ||
            curr.productSlug !== product.slug ||
            (sw.color && curr.colorHex !== sw.color) ||
            curr.colorName !== sw.name ||
            curr.size !== sz
          ) {
            cleaned[foundIdx] = {
              ...curr,
              productTitle: product.title,
              productSlug: product.slug,
              colorName: sw.name,
              colorHex: sw.color || curr.colorHex,
              size: sz,
              updatedAt: new Date().toISOString(),
            };
            changed = true;
          }
        }
      }
    }
  }

  if (changed) {
    await saveServerInventoryVariants(cleaned);
  }

  return cleaned;
}

/**
 * Kurangi stok secara otomatis untuk setiap item dalam pesanan yang sudah dibayar.
 * Dipanggil dari TriPay webhook dan admin PATCH order status → 'paid'.
 * Aman dijalankan lebih dari sekali karena idempotent per variantId (tidak re-deduct jika stok sudah 0).
 */
function isVariantMatch(v: ProductVariant, item: { id?: string; title?: string; slug?: string }): boolean {
  const itemId = String(item.id || '').toLowerCase().trim();
  const itemTitle = String(item.title || '').toLowerCase().trim();
  const vTitle = v.productTitle.toLowerCase().trim();
  const vSlug = (v.productSlug || '').toLowerCase().trim();
  const vProdId = String(v.productId).toLowerCase().trim();

  // 1. Direct ID matches
  if (v.id.toLowerCase() === itemId || vProdId === itemId) return true;

  // 2. Slug prefix matches (e.g. item.id = "paloma-khiban-obsidian-black-s", vSlug = "paloma-khiban")
  if (vSlug && (itemId === vSlug || itemId.startsWith(vSlug) || itemId.includes(vSlug))) return true;

  // 3. Title matches
  if (itemTitle && vTitle && (vTitle === itemTitle || itemTitle.includes(vTitle) || vTitle.includes(itemTitle))) {
    return true;
  }

  return false;
}

export async function deductStockForOrder(
  items: Array<{ id: string; title?: string; color?: string; size?: string; quantity?: number; qty?: number }>,
  orderNumber: string,
  customerName: string
): Promise<void> {
  const allVariants = await getServerInventoryVariants();

  for (const item of items) {
    try {
      const targetQty = Math.max(1, Number(item.quantity ?? item.qty ?? 1));

      // 1. Cari varian yang cocok produknya DAN warna + ukuran
      let variant = allVariants.find(
        (v) =>
          isVariantMatch(v, item) &&
          v.colorName.toLowerCase() === (item.color || '').toLowerCase() &&
          v.size.toUpperCase() === (item.size || '').toUpperCase()
      );

      // 2. Jika warna tidak cocok persis (misal warna sudah di-rename), cari kecocokan ukuran
      if (!variant) {
        variant = allVariants.find(
          (v) =>
            isVariantMatch(v, item) &&
            v.size.toUpperCase() === (item.size || '').toUpperCase()
        );
      }

      // 3. Fallback: ambil varian pertama dari produk tersebut yang stoknya masih ada
      if (!variant) {
        variant = allVariants.find((v) => isVariantMatch(v, item) && v.stock > 0) ||
                  allVariants.find((v) => isVariantMatch(v, item));
      }

      if (!variant) {
        console.warn(
          `[deductStockForOrder] Varian tidak ditemukan untuk: id="${item.id}" title="${item.title}" warna="${item.color}" ukuran="${item.size}" — dilewati.`
        );
        continue;
      }

      if (variant.stock <= 0) {
        console.warn(
          `[deductStockForOrder] Stok varian ${variant.sku} sudah 0, tidak ada yang dikurangi.`
        );
        continue;
      }

      const actualDeductQty = Math.min(targetQty, variant.stock);
      if (actualDeductQty <= 0) continue;

      await executeServerStockMutation({
        variantId: variant.id,
        type: 'out',
        quantity: actualDeductQty,
        reason: 'ORDER_FULFILLMENT',
        reference: orderNumber,
        notes: `Pembelian oleh ${customerName} via Web`,
        createdBy: 'Sistem Otomatis (Checkout)',
      });
    } catch (err) {
      console.warn(
        `[deductStockForOrder] Gagal kurangi stok untuk item produk="${item.id}":`,
        err
      );
    }
  }
}

export async function addServerCustomVariant(params: {
  productId: string | number;
  productTitle: string;
  productSlug: string;
  colorName: string;
  colorHex: string;
  size: string;
  initialStock?: number;
}): Promise<ProductVariant> {
  const existing = await getServerInventoryVariants();
  const cleanColor = params.colorName.trim();
  const cleanSize = params.size.trim().toUpperCase();
  const sku = generateVariantSku(params.productTitle, params.productId, cleanColor, cleanSize);
  const variantId = `${params.productId}-${cleanColor.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${cleanSize.toLowerCase()}`;

  const found = existing.find(
    (v) => v.id === variantId || (v.productId === String(params.productId) && v.colorName.toLowerCase() === cleanColor.toLowerCase() && v.size.toUpperCase() === cleanSize)
  );
  if (found) {
    throw new Error(`Varian warna "${cleanColor}" ukuran "${cleanSize}" untuk produk ini sudah ada.`);
  }

  const initialStock = Math.max(0, params.initialStock ?? 0);
  const newVariant: ProductVariant = {
    id: variantId,
    productId: String(params.productId),
    productSlug: params.productSlug,
    productTitle: params.productTitle,
    sku,
    colorName: cleanColor,
    colorHex: params.colorHex || '#1A1A1A',
    size: cleanSize,
    stock: initialStock,
    lowStockThreshold: 3,
    updatedAt: new Date().toISOString(),
  };

  const updatedList = [newVariant, ...existing];
  await saveServerInventoryVariants(updatedList);

  if (initialStock > 0) {
    const mutation: StockMutation = {
      id: `mut-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      variantId,
      sku,
      productTitle: params.productTitle,
      colorName: cleanColor,
      size: cleanSize,
      type: 'in',
      quantity: initialStock,
      previousStock: 0,
      currentStock: initialStock,
      reason: 'RESTOCK_PRODUCTION',
      notes: 'Stok awal varian baru',
      createdBy: 'Admin Studio',
      createdAt: new Date().toISOString(),
    };
    const currentMutations = await getServerStockMutations();
    await saveServerStockMutations([mutation, ...currentMutations]);
  }

  return newVariant;
}

/**
 * Hapus seluruh varian inventaris untuk produk yang dihapus di katalog.
 */
export async function deleteServerProductVariants(productId: string): Promise<ProductVariant[]> {
  const existing = await getServerInventoryVariants();
  const updated = existing.filter((v) => String(v.productId) !== String(productId));
  await saveServerInventoryVariants(updated);
  return updated;
}
