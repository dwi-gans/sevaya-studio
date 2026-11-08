import { DbProduct, getDbProducts, updateDbProduct } from './products';
import { supabase } from './client';

export interface ProductVariant {
  id: string;                    // UUID unik varian
  productId: string;             // ID produk induk
  productSlug: string;           // Slug produk
  productTitle: string;          // Nama produk
  sku: string;                   // Kode unik terstruktur cth: SVY-FINA-BLK-S
  colorName: string;             // Nama warna cth: Obsidian Black
  colorHex: string;              // Hex warna cth: #1A1A1A
  size: string;                  // Ukuran cth: S, M, L, XL, All Size
  stock: number;                 // Stok fisik saat ini
  lowStockThreshold: number;     // Batas peringatan stok menipis (default 3)
  updatedAt: string;
}

export type MutationType = 'in' | 'out' | 'adjustment';

export type MutationReason =
  | 'RESTOCK_PRODUCTION'   // Hasil produksi konveksi
  | 'CUSTOMER_ORDER'       // Penjualan order pelanggan
  | 'ORDER_FULFILLMENT'    // Pemenuhan pesanan otomatis saat pembayaran dikonfirmasi
  | 'CUSTOMER_RETURN'      // Retur pelanggan
  | 'DAMAGE_DEFECT'        // Cacat kain / reject
  | 'SAMPLE_MARKETING'     // Photoshoot / endorse
  | 'STOCK_OPNAME'         // Penyesuaian stok opname gudang
  | 'OTHER';

export interface StockMutation {
  id: string;
  variantId: string;
  sku: string;
  productTitle: string;
  colorName: string;
  size: string;
  type: MutationType;
  quantity: number;        // angka positif untuk in/adjustment naik, negatif/positif untuk out
  previousStock: number;
  currentStock: number;
  reason: MutationReason;
  reference?: string;      // No PO, no resi, no invoice order
  notes?: string;          // Catatan admin
  createdBy?: string;      // Admin yang menginput
  createdAt: string;
}

const INVENTORY_FILE = 'inventory.json';
const MUTATIONS_FILE = 'stock_mutations.json';
const LS_VARIANTS_KEY = 'sevaya_inventory_variants_v1';
const LS_MUTATIONS_KEY = 'sevaya_stock_mutations_v1';

/**
 * Helper untuk men-generate SKU unik terstandarisasi.
 * Format: SVY-[4 huruf judul]-[2 digit ID produk]-[3 huruf warna]-[size]
 * Contoh: SVY-FINA01-BLK-S  ← ID suffix mencegah collision antar produk berbeda
 *
 * @param productTitle  Nama produk
 * @param productId     ID unik produk (string/number) — 2 digit terakhir dipakai sebagai suffix
 * @param colorName     Nama warna swatch
 * @param size          Kode ukuran (S / M / L)
 */
export function generateVariantSku(
  productTitle: string,
  productId: string | number,
  colorName: string,
  size: string,
): string {
  // 4 huruf alfanumerik dari judul produk (uppercase)
  const prodCode = productTitle
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4) || 'PROD';

  // 2 digit terakhir dari ID produk (mencegah collision nama mirip)
  const idSuffix = String(productId)
    .replace(/[^A-Z0-9]/gi, '')
    .slice(-2)
    .toUpperCase()
    .padStart(2, '0');

  // 3 huruf dari nama warna
  const colorCode = colorName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 3) || 'CLR';

  // Kode size apa adanya (S / M / L)
  const sizeCode = size
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9]/g, '') || 'ALL';

  return `SVY-${prodCode}${idSuffix}-${colorCode}-${sizeCode}`;
}

/**
 * Buat varian default secara otomatis dari swatches & sizes produk jika belum ada.
 * Sizes tetap S, M, L (sesuai standar SEVAYA).
 */
export function generateDefaultVariantsForProduct(product: DbProduct): ProductVariant[] {
  const swatches = product.swatches && product.swatches.length > 0
    ? product.swatches
    : [{ name: 'Black', color: '#1A1A1A' }];

  const sizes = product.sizes && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L'];
  const baseStock = typeof product.stock === 'number' ? product.stock : (product.inStock === false ? 0 : 25);
  // Bagi rata ke tiap varian (jika baseStock 0, maka 0)
  const stockPerVariant = baseStock > 0 ? Math.floor(baseStock / (swatches.length * sizes.length)) : 0;

  const variants: ProductVariant[] = [];

  for (const sw of swatches) {
    for (const sz of sizes) {
      const sku = generateVariantSku(product.title, product.id, sw.name, sz);
      variants.push({
        id: `${product.id}-${sw.name.toLowerCase().replace(/\s+/g, '-')}-${sz.toLowerCase()}`,
        productId: String(product.id),
        productSlug: product.slug,
        productTitle: product.title,
        sku,
        colorName: sw.name,
        colorHex: sw.color,
        size: sz,
        stock: stockPerVariant,
        lowStockThreshold: 3,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return variants;
}

let _cachedVariants: ProductVariant[] | null = null;
let _cachedMutations: StockMutation[] | null = null;

export function invalidateInventoryCache(): void {
  _cachedVariants = null;
  _cachedMutations = null;
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(LS_VARIANTS_KEY);
      localStorage.removeItem(LS_MUTATIONS_KEY);
    } catch {
      // ignore
    }
  }
}

/**
 * Ambil semua varian inventaris (dengan fallback auto-generator dari katalog produk)
 */
export async function getInventoryVariants(forceRefresh = false): Promise<ProductVariant[]> {
  if (forceRefresh) {
    invalidateInventoryCache();
  } else if (_cachedVariants && _cachedVariants.length > 0) {
    return _cachedVariants;
  }

  // 1. Prioritaskan server API endpoint (/api/admin/inventory) yang didukung service-role & persistensi disk
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(`/api/admin/inventory${forceRefresh ? '?refresh=true' : ''}`, {
        headers: {
          'x-admin-key': 'sevaya-admin',
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && Array.isArray(json.variants) && json.variants.length > 0) {
          _cachedVariants = json.variants;
          try {
            localStorage.setItem(LS_VARIANTS_KEY, JSON.stringify(json.variants));
          } catch {
            // ignore
          }
          return json.variants;
        }
      }
    } catch {
      // fallback jika network gagal
    }
  }

  // 2. Coba dari Cloud Storage via anon Supabase client
  try {
    const { data, error } = await supabase.storage.from('catalog').download(INVENTORY_FILE);
    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text) as ProductVariant[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        _cachedVariants = parsed;
        return parsed;
      }
    }
  } catch {
    // Ignore & lanjut fallback
  }

  // 3. Coba localStorage (browser)
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem(LS_VARIANTS_KEY);
      if (local) {
        const parsed = JSON.parse(local) as ProductVariant[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          _cachedVariants = parsed;
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }

  // 4. Fallback terakhir: Auto-generate dari daftar produk yang ada di katalog
  const products = await getDbProducts();
  const allVariants: ProductVariant[] = [];
  for (const p of products) {
    allVariants.push(...generateDefaultVariantsForProduct(p));
  }

  _cachedVariants = allVariants;
  await saveInventoryVariants(allVariants);
  return allVariants;
}

/**
 * Simpan varian inventaris ke Cloud Storage & localStorage
 */
export async function saveInventoryVariants(variants: ProductVariant[]): Promise<void> {
  _cachedVariants = variants;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LS_VARIANTS_KEY, JSON.stringify(variants));
    } catch {
      // ignore
    }
  }

  try {
    const jsonStr = JSON.stringify(variants, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    await supabase.storage.from('catalog').upload(INVENTORY_FILE, blob, {
      upsert: true,
      contentType: 'application/json',
    });
  } catch (err) {
    console.warn('[saveInventoryVariants] cloud sync error:', err);
  }
}

/**
 * Ambil riwayat mutasi stok
 */
export async function getStockMutations(): Promise<StockMutation[]> {
  if (_cachedMutations && _cachedMutations.length > 0) {
    return _cachedMutations;
  }

  // 1. Prioritaskan server API endpoint (/api/admin/inventory)
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/admin/inventory', {
        headers: {
          'x-admin-key': 'sevaya-admin',
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && Array.isArray(json.mutations)) {
          _cachedMutations = json.mutations;
          try {
            localStorage.setItem(LS_MUTATIONS_KEY, JSON.stringify(json.mutations));
          } catch {
            // ignore
          }
          return json.mutations;
        }
      }
    } catch {
      // fallback
    }
  }

  try {
    const { data, error } = await supabase.storage.from('catalog').download(MUTATIONS_FILE);
    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text) as StockMutation[];
      if (Array.isArray(parsed)) {
        _cachedMutations = parsed;
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem(LS_MUTATIONS_KEY);
      if (local) {
        const parsed = JSON.parse(local) as StockMutation[];
        if (Array.isArray(parsed)) {
          _cachedMutations = parsed;
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }

  return [];
}

/**
 * Simpan mutasi stok ke riwayat
 */
export async function saveStockMutations(mutations: StockMutation[]): Promise<void> {
  _cachedMutations = mutations;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LS_MUTATIONS_KEY, JSON.stringify(mutations));
    } catch {
      // ignore
    }
  }

  try {
    const jsonStr = JSON.stringify(mutations, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    await supabase.storage.from('catalog').upload(MUTATIONS_FILE, blob, {
      upsert: true,
      contentType: 'application/json',
    });
  } catch (err) {
    console.warn('[saveStockMutations] cloud sync error:', err);
  }
}

/**
 * Catat Mutasi Stok Masuk / Keluar / Penyesuaian secara Atomic & Sinkronkan Total Stok Produk!
 */
export async function executeStockMutation(params: {
  variantId: string;
  type: MutationType;
  quantity: number;
  reason: MutationReason;
  reference?: string;
  notes?: string;
  createdBy?: string;
}): Promise<{ variant: ProductVariant; mutation: StockMutation }> {
  const variants = await getInventoryVariants();
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
  await saveInventoryVariants(variants);

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

  const existingMutations = await getStockMutations();
  await saveStockMutations([mutation, ...existingMutations]);

  // Sinkronkan Total Stok Produk Induk di Katalog!
  try {
    const productVariants = variants.filter((v) => v.productId === target.productId);
    const totalProductStock = productVariants.reduce((sum, v) => sum + v.stock, 0);

    await updateDbProduct(target.productId, {
      stock: totalProductStock,
      inStock: totalProductStock > 0,
    });
  } catch (syncErr) {
    console.warn('[executeStockMutation] product catalog sync warning:', syncErr);
  }

  return { variant: updatedVariant, mutation };
}

/**
 * Sinkronkan varian ketika produk dibuat atau diedit di katalog.
 * Menjamin setiap swatch x size memiliki varian, tanpa menghapus stok yang sudah ada.
 */
export async function ensureVariantsForProduct(product: DbProduct): Promise<ProductVariant[]> {
  const existing = await getInventoryVariants();
  const swatches = product.swatches && product.swatches.length > 0
    ? product.swatches
    : [{ name: 'Default', color: '#1A1A1A' }];
  const sizes = product.sizes && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L'];

  const allowedColorNames = new Set(swatches.map((s) => s.name.trim().toLowerCase()));
  const allowedSizes = new Set(sizes.map((sz) => sz.trim().toLowerCase()));

  let changed = false;

  // 1. Hapus varian yang warna atau ukurannya sudah dihapus dari katalog produk
  let updatedList = existing.filter((v) => {
    if (v.productId !== String(product.id)) {
      return true;
    }
    const isColorValid = allowedColorNames.has(v.colorName.trim().toLowerCase());
    const isSizeValid = allowedSizes.has(v.size.trim().toLowerCase());
    if (!isColorValid || !isSizeValid) {
      changed = true;
      return false; // Hapus varian yang warnanya/ukurannya sudah dihapus dari katalog
    }
    return true;
  });

  // 2. Pastikan setiap varian kombinasi aktif (swatch x size) sudah tersedia
  for (const sw of swatches) {
    for (const sz of sizes) {
      const variantId = `${product.id}-${sw.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${sz.toLowerCase()}`;
      const foundIdx = updatedList.findIndex(
        (v) => v.id === variantId || (v.productId === String(product.id) && v.colorName.toLowerCase() === sw.name.toLowerCase() && v.size.toLowerCase() === sz.toLowerCase())
      );

      if (foundIdx === -1) {
        // Buat varian baru dengan stok 0 (stok fisik dimasukkan via mutasi / restock resmi)
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
        // Update informasi induk (judul, slug, warna hex) jika berubah
        const curr = updatedList[foundIdx]!;
        if (curr.productTitle !== product.title || curr.productSlug !== product.slug || curr.colorHex !== sw.color) {
          updatedList[foundIdx] = {
            ...curr,
            productTitle: product.title,
            productSlug: product.slug,
            colorHex: sw.color || curr.colorHex,
            updatedAt: new Date().toISOString(),
          };
          changed = true;
        }
      }
    }
  }

  if (changed) {
    await saveInventoryVariants(updatedList);
  }

  // Hitung total stok dan pastikan produk induk tersinkronkan
  const productVariants = updatedList.filter((v) => v.productId === String(product.id));
  const totalStock = productVariants.reduce((sum, v) => sum + v.stock, 0);
  if (product.stock !== totalStock || product.inStock !== (totalStock > 0)) {
    try {
      await updateDbProduct(product.id, {
        stock: totalStock,
        inStock: totalStock > 0,
      });
    } catch {
      // ignore
    }
  }

  return updatedList;
}

/**
 * Tambah varian kustom langsung dari tab inventaris
 */
export async function addCustomVariant(params: {
  productId: string | number;
  productTitle: string;
  productSlug: string;
  colorName: string;
  colorHex: string;
  size: string;
  initialStock?: number;
}): Promise<ProductVariant> {
  const existing = await getInventoryVariants();
  const cleanColor = params.colorName.trim();
  const cleanSize = params.size.trim().toUpperCase();
  const sku = generateVariantSku(params.productTitle, params.productId, cleanColor, cleanSize);
  const variantId = `${params.productId}-${cleanColor.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${cleanSize.toLowerCase()}`;

  // Cek apakah sudah ada
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
  await saveInventoryVariants(updatedList);

  // Jika ada stok awal > 0, catat mutasi awal
  if (initialStock > 0) {
    const mutation: StockMutation = {
      id: `mut-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      variantId: newVariant.id,
      sku: newVariant.sku,
      productTitle: newVariant.productTitle,
      colorName: newVariant.colorName,
      size: newVariant.size,
      type: 'in',
      quantity: initialStock,
      previousStock: 0,
      currentStock: initialStock,
      reason: 'RESTOCK_PRODUCTION',
      reference: 'INITIAL_STOCK',
      notes: 'Stok awal penambahan varian baru',
      createdBy: 'Admin Studio',
      createdAt: new Date().toISOString(),
    };
    const mutations = await getStockMutations();
    await saveStockMutations([mutation, ...mutations]);
  }

  // Sync katalog produk
  try {
    const productVariants = updatedList.filter((v) => v.productId === String(params.productId));
    const totalStock = productVariants.reduce((sum, v) => sum + v.stock, 0);
    await updateDbProduct(params.productId, {
      stock: totalStock,
      inStock: totalStock > 0,
    });
  } catch (err) {
    console.warn('[addCustomVariant] product catalog sync warning:', err);
  }

  return newVariant;
}

/**
 * Hapus seluruh varian inventaris untuk produk yang dihapus di katalog.
 */
export async function deleteInventoryVariantsForProduct(productId: string | number): Promise<ProductVariant[]> {
  const existing = await getInventoryVariants();
  const filtered = existing.filter((v) => String(v.productId) !== String(productId));
  await saveInventoryVariants(filtered);
  return filtered;
}
