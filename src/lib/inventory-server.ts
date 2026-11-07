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
import { setCachedProducts, getCachedProducts } from '@/lib/products-cache';

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
    const { data, error } = await supabaseAdmin.storage
      .from('catalog')
      .download(filename);
    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text) as T;
      return parsed;
    }
  } catch {
    // Remote storage might be unavailable or offline in sandbox/dev
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
      });
    return !error;
  } catch {
    return false;
  }
}

// In-memory caches to guarantee microsecond server performance
let _serverCachedVariants: ProductVariant[] | null = null;
let _serverCachedMutations: StockMutation[] | null = null;

export async function getServerProducts(): Promise<DbProduct[]> {
  const { products: cached, expired } = getCachedProducts();
  if (cached && !expired && cached.length > 0) {
    return cached;
  }

  // 1. Disk fallback (primary for dev/sandbox & fast persistence)
  const fromLocal = readLocalFile<DbProduct[]>(PRODUCTS_FILE);
  if (Array.isArray(fromLocal) && fromLocal.length > 0) {
    setCachedProducts(fromLocal);
    return fromLocal;
  }

  // 2. Storage
  const fromStorage = await downloadFromStorage<DbProduct[]>(PRODUCTS_FILE);
  if (Array.isArray(fromStorage) && fromStorage.length > 0) {
    setCachedProducts(fromStorage);
    writeLocalFile(PRODUCTS_FILE, fromStorage);
    return fromStorage;
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
  if (!forceRefresh && _serverCachedVariants && _serverCachedVariants.length > 0) {
    return _serverCachedVariants;
  }

  // 1. Storage
  const fromStorage = await downloadFromStorage<ProductVariant[]>(INVENTORY_FILE);
  if (Array.isArray(fromStorage) && fromStorage.length > 0) {
    _serverCachedVariants = fromStorage;
    writeLocalFile(INVENTORY_FILE, fromStorage);
    return fromStorage;
  }

  // 2. Disk fallback
  const fromLocal = readLocalFile<ProductVariant[]>(INVENTORY_FILE);
  if (Array.isArray(fromLocal) && fromLocal.length > 0) {
    _serverCachedVariants = fromLocal;
    return fromLocal;
  }

  // 3. Fallback: generate default variants from catalog products
  const products = await getServerProducts();
  const allVariants: ProductVariant[] = [];
  for (const p of products) {
    allVariants.push(...generateDefaultVariantsForProduct(p));
  }

  _serverCachedVariants = allVariants;
  await saveServerInventoryVariants(allVariants);
  return allVariants;
}

export async function saveServerInventoryVariants(variants: ProductVariant[]): Promise<void> {
  _serverCachedVariants = variants;
  writeLocalFile(INVENTORY_FILE, variants);
  await uploadToStorage(INVENTORY_FILE, variants);
}

export async function getServerStockMutations(): Promise<StockMutation[]> {
  if (_serverCachedMutations && _serverCachedMutations.length > 0) {
    return _serverCachedMutations;
  }

  const fromStorage = await downloadFromStorage<StockMutation[]>(MUTATIONS_FILE);
  if (Array.isArray(fromStorage)) {
    _serverCachedMutations = fromStorage;
    writeLocalFile(MUTATIONS_FILE, fromStorage);
    return fromStorage;
  }

  const fromLocal = readLocalFile<StockMutation[]>(MUTATIONS_FILE);
  if (Array.isArray(fromLocal)) {
    _serverCachedMutations = fromLocal;
    return fromLocal;
  }

  return [];
}

export async function saveServerStockMutations(mutations: StockMutation[]): Promise<void> {
  _serverCachedMutations = mutations;
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
    newStock = prevStock + qty;
  } else if (params.type === 'out') {
    newStock = Math.max(0, prevStock - qty);
  } else if (params.type === 'adjustment') {
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

  const allowedColorNames = new Set(swatches.map((s) => s.name.trim().toLowerCase()));
  const allowedSizes = new Set(sizes.map((sz) => sz.trim().toLowerCase()));

  let changed = false;

  // 1. Hapus varian lama yang warna atau ukurannya sudah dihapus dari katalog produk
  let updatedList = existing.filter((v) => {
    if (v.productId !== String(product.id)) {
      return true;
    }
    const isColorValid = allowedColorNames.has(v.colorName.trim().toLowerCase());
    const isSizeValid = allowedSizes.has(v.size.trim().toLowerCase());
    if (!isColorValid || !isSizeValid) {
      changed = true;
      return false; // Hapus varian ini dari inventaris
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
    await saveServerInventoryVariants(updatedList);
  }

  // Sinkronkan total stok ke katalog produk
  const productVariants = updatedList.filter((v) => v.productId === String(product.id));
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
 * Membersihkan semua varian inventaris yang produk induknya sudah dihapus,
 * atau yang warna/ukurannya sudah dihapus dari katalog produk.
 */
export async function cleanServerOrphanedVariants(): Promise<ProductVariant[]> {
  const [products, variants] = await Promise.all([
    getServerProducts(),
    getServerInventoryVariants(),
  ]);

  const productMap = new Map<string, DbProduct>();
  products.forEach((p) => {
    productMap.set(String(p.id), p);
  });

  let changed = false;
  const cleaned = variants.filter((v) => {
    const parent = productMap.get(v.productId);
    if (!parent) {
      changed = true;
      return false; // Produk induk sudah dihapus
    }

    if (parent.swatches && parent.swatches.length > 0) {
      const colorValid = parent.swatches.some(
        (s) => s.name.trim().toLowerCase() === v.colorName.trim().toLowerCase()
      );
      if (!colorValid) {
        changed = true;
        return false; // Warna sudah dihapus dari katalog
      }
    }

    if (parent.sizes && parent.sizes.length > 0) {
      const sizeValid = parent.sizes.some(
        (sz) => sz.trim().toLowerCase() === v.size.trim().toLowerCase()
      );
      if (!sizeValid) {
        changed = true;
        return false; // Ukuran sudah dihapus dari katalog
      }
    }

    return true;
  });

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
export async function deductStockForOrder(
  items: Array<{ id: string; color?: string; size?: string; quantity: number }>,
  orderNumber: string,
  customerName: string
): Promise<void> {
  const allVariants = await getServerInventoryVariants();

  for (const item of items) {
    try {
      const variant = allVariants.find(
        (v) =>
          String(v.productId) === String(item.id) &&
          v.colorName.toLowerCase() === (item.color || '').toLowerCase() &&
          v.size.toUpperCase() === (item.size || '').toUpperCase()
      );

      if (!variant) {
        console.warn(
          `[deductStockForOrder] Varian tidak ditemukan: produk="${item.id}" warna="${item.color}" ukuran="${item.size}" — dilewati.`
        );
        continue;
      }

      if (variant.stock <= 0) {
        console.warn(
          `[deductStockForOrder] Stok varian ${variant.sku} sudah 0, tidak ada yang dikurangi.`
        );
        continue;
      }

      await executeServerStockMutation({
        variantId: variant.id,
        type: 'out',
        quantity: item.quantity,
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
