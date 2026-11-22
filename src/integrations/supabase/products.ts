import { supabase } from './client';

export interface ProductSwatch {
  name: string;
  color: string;
  image?: string;    // cover photo (foto 1) mewakili warna ini
  images?: string[]; // extra photos (foto 2–4), max 3 items
}

export interface DbProduct {
  id: string | number;
  slug: string;
  title: string;
  category?: 'abaya' | 'khimar' | string; // kategori busana: Abaya atau Khimar
  edition?: string;
  price: number;
  original_price?: number;
  badge?: string;
  image: string;
  images?: string[];
  swatches: ProductSwatch[];
  sizes?: string[];      // daftar ukuran yang tersedia, cth: ['S', 'M', 'L'] atau ['All Size']
  description?: string;  // deskripsi produk utama
  fabric?: string;       // informasi bahan / kain lengkap
  material?: string;     // jenis material ringkas untuk label spesifikasi (cth: "100% Cupro Silk Linen")
  sizing?: string;       // panduan ukuran / size chart
  inStock?: boolean;
  stock?: number; // available inventory quantity
  hidden?: boolean; // if true, product is hidden from the public storefront
}

export const DEFAULT_DB_PRODUCTS: DbProduct[] = [
  {
    id: '1794063420037',
    slug: 'paloma-khiban',
    title: 'Paloma Khiban',
    category: 'khimar',
    edition: '',
    price: 199000,
    original_price: 239000,
    badge: '',
    image: '/images/catalog/catalog-13.jpg',
    inStock: true,
    hidden: false,
    stock: 55,
    sizes: ['S', 'M'],
    swatches: [
      {
        name: 'Burgundy',
        color: '#723b61',
        image: '/images/catalog/catalog-03.jpg',
        images: ['/images/catalog/catalog-07.jpg', '/images/catalog/catalog-08.jpg'],
      },
      {
        name: 'PinkBlush',
        color: '#e5bdd8',
        image: '/images/catalog/catalog-04.jpg',
        images: ['/images/catalog/catalog-02.jpg', '/images/catalog/catalog-10.jpg'],
      },
      {
        name: 'ButterCream',
        color: '#f8e9d3',
        image: '/images/catalog/catalog-18.jpg',
        images: ['/images/catalog/catalog-17.jpg', '/images/catalog/catalog-13.jpg'],
      },
      {
        name: 'WarmSand',
        color: '#d0c8a9',
        image: '/images/catalog/catalog-13.jpg',
        images: [],
      },
    ],
    description:
      'Paloma Khiban is thoughtfully designed for everyday comfort and practicality. Made from durable Arabian fabric, it offers a lightweight, comfortable feel while maintaining its shape beautifully. An effortless essential for completing your modest everyday look.',
    fabric: 'Arabian Exclusive',
    material: 'Arabian Exclusive',
    sizing:
      'S = Lingkar Wajah: 60 cm, Panjang Depan: 103 cm, Panjang Belakang: 134 cm, Panjang Samping: 52 cm, Lebar Bandana: 7 cm, Panjang Bandana: 49 cm x 2 cm\n\nM = Lingkar Wajah: 61,5 cm, Panjang Depan: 103 cm, Panjang Belakang: 134 cm, Panjang Samping: 52 cm, Lebar Bandana: 7 cm, Panjang Bandana: 49 cm x 2 cm',
  },
  {
    id: '1794019430147',
    slug: 'sevilla-cupro-abaya',
    title: 'Sevilla Cupro Abaya',
    category: 'abaya',
    edition: '',
    price: 899000,
    original_price: 899000,
    badge: '',
    image: '/images/catalog/catalog-02.jpg',
    inStock: true,
    hidden: false,
    stock: 13,
    sizes: ['M', 'L'],
    swatches: [
      {
        name: 'Plum',
        color: '#824483',
        image: '/images/catalog/catalog-02.jpg',
        images: ['/images/catalog/catalog-04.jpg', '/images/catalog/catalog-05.jpg'],
      },
      {
        name: 'Olive',
        color: '#8d8600',
        image: '/images/catalog/catalog-18.jpg',
        images: ['/images/catalog/catalog-16.jpg', '/images/catalog/catalog-12.jpg', '/images/catalog/catalog-14.jpg'],
      },
      {
        name: 'Buttermilk',
        color: '#f5e9bd',
        image: '/images/catalog/catalog-15.jpg',
        images: ['/images/catalog/catalog-13.jpg', '/images/catalog/catalog-12.jpg'],
      },
      {
        name: 'Misty Purple',
        color: '#dac1dc',
        image: '/images/catalog/catalog-02.jpg',
        images: ['/images/catalog/catalog-03.jpg', '/images/catalog/catalog-07.jpg', '/images/catalog/catalog-06.jpg'],
      },
    ],
    description:
      'Sevilla Abaya is a timeless expression of everyday elegance. Crafted from a soft, fluid blend of 60% Cupro and 40% Viscose, it offers a naturally silky feel with effortless comfort. Thoughtfully designed with a modest silhouette, hidden pockets, and delicate sleeve details, Sevilla brings together simplicity, comfort, and understated elegance for everyday wear. 🤍',
    fabric: '60% Cupro 40% Viscose',
    material: 'Cupro',
    sizing:
      'M = Bust: 120 cm, Length: 137 cm, Sleeve: 70 cm\nL = Bust: 125 cm, Length: 142 cm, Sleeve: 72 cm',
  },
  {
    id: '1793862893527',
    slug: 'alma-cupro-stripes',
    title: 'Alma Cupro Stripes',
    category: 'abaya',
    edition: '',
    price: 859000,
    original_price: 899000,
    badge: 'Trending',
    image: '/images/catalog/catalog-01.jpg',
    inStock: true,
    hidden: false,
    stock: 10,
    sizes: ['S', 'M', 'L', 'XL'],
    swatches: [
      {
        name: 'Burgundy',
        color: '#804d6f',
        image: '/images/catalog/catalog-01.jpg',
        images: ['/images/catalog/catalog-06.jpg', '/images/catalog/catalog-08.jpg'],
      },
      {
        name: 'Coffee',
        color: '#C68B59',
        image: '/images/catalog/catalog-08.jpg',
        images: ['/images/catalog/catalog-06.jpg', '/images/catalog/catalog-01.jpg'],
      },
      {
        name: 'SoftPink',
        color: '#e1b7d4',
        image: '/images/catalog/catalog-06.jpg',
        images: ['/images/catalog/catalog-01.jpg', '/images/catalog/catalog-08.jpg'],
      },
    ],
    description:
      "OPEN PO PERIOD\n10 November 2026, pukul 09.00 WIB\nSampai dengan\n16 November 2026, pukul 17.00 WIB\n\nSelama periode Open PO, kamu bisa mendapatkan ALMA Cupro Stripes dengan harga spesial pre-order.\n\nUntuk pembelian melalui Shopee, harga akan sedikit berbeda karena telah disesuaikan dengan biaya administrasi platform dan komisi marketplace.\n\nESTIMATED DELIVERY\nProduk akan mulai dikirim dalam waktu 1–2 minggu setelah periode Open PO ditutup, yaitu setelah 16 November 2026.\n\nSetelah periode Open PO berakhir, harga ALMA Cupro Stripes akan kembali ke harga normal Rp899.000.\n\nMark your calendar and don't miss the pre-order period!\n\nThank you for being part of SEVAYA's journey. May ALMA accompany you through many beautiful, ordinary days.",
    fabric:
      '60% Cupro 38% Viscose 2% Polyester\nAlma Cupro Stripes is made from a soft, breathable Cupro-blend fabric, featuring delicate stripes that add a subtle touch of character. Designed with a relaxed silhouette for effortless movement and everyday comfort, while embracing the beauty of simplicity and modesty.',
    material: 'Cupro',
    sizing:
      'S = Bust: 130 cm, Sleeve: 70 cm, Length: 130 cm\nM = Bust: 130 cm, Sleeve: 71 cm, Length: 136 cm\nL = Bust: 130 cm, Sleeve: 72 cm, Length: 140 cm\nXL = Bust: 135 cm, Sleeve: 73 cm, Length: 145 cm',
  },
];

const PRODUCTS_FILE = 'products.json';
const LS_KEY = 'sevaya_products_v3';

/**
 * Save products to localStorage (client-side persistent fallback).
 */
function saveToLocalStorage(products: DbProduct[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(products));
  } catch {
    // quota exceeded or SSR — ignore
  }
}

/**
 * Load products from localStorage.
 */
export function loadFromLocalStorage(): DbProduct[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DbProduct[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    // Sanitasi: jika ada logo_ibey atau data korup lama, hapus cache lama
    const rawStr = JSON.stringify(parsed);
    if (rawStr.includes('logo_ibey')) {
      localStorage.removeItem(LS_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Saves current products list to Supabase Storage JSON cloud sync.
 * Writes via API endpoint (/api/products) to leverage privileged service role,
 * and saves to localStorage for instant local preview.
 */
async function syncProductsToCloudStorage(products: DbProduct[]): Promise<void> {
  // Always save to localStorage first (instant, reliable fallback)
  saveToLocalStorage(products);

  if (typeof globalThis !== 'undefined' && globalThis.__sevayaProductsCache) {
    globalThis.__sevayaProductsCache.products = products;
    globalThis.__sevayaProductsCache.timestamp = Date.now();
  }

  try {
    if (typeof window !== 'undefined') {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'sevaya-admin',
        },
        body: JSON.stringify({ products }),
      });
      if (!res.ok) {
        console.warn('API sync warning: HTTP', res.status);
      }
    }
  } catch (e) {
    console.warn('Failed to sync products to /api/products:', e);
  }
}
let _cachedProducts: DbProduct[] | null = null;
let _cachedTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 menit in-memory cache

async function loadServerDiskProducts(): Promise<DbProduct[] | null> {
  if (typeof window !== 'undefined') return null;
  try {
    const fs = await import(/* webpackIgnore: true */ 'fs');
    const path = await import(/* webpackIgnore: true */ 'path');
    const diskPath = path.join(process.cwd(), '.data', PRODUCTS_FILE);
    if (fs.existsSync(diskPath)) {
      const raw = fs.readFileSync(diskPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as DbProduct[];
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function invalidateProductsCache(): void {
  _cachedProducts = null;
  _cachedTime = 0;
  if (typeof globalThis !== 'undefined' && globalThis.__sevayaProductsCache) {
    globalThis.__sevayaProductsCache.products = null;
    globalThis.__sevayaProductsCache.timestamp = 0;
  }
  // Clear localStorage so stale data never surfaces as fallback
  if (typeof window !== 'undefined') {
    try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
  }
}

/**
 * Fetch products with fast in-memory cache & non-blocking timeout fallback.
 */
export async function getDbProducts(forceRefresh = false): Promise<DbProduct[]> {
  const now = Date.now();

  // 0. Di Server (SSR): selalu baca disk lokal .data/products.json terlebih dahulu agar SSR selalu sinkron dengan data produk yang diedit admin
  if (typeof window === 'undefined') {
    const fromDisk = await loadServerDiskProducts();
    if (fromDisk && fromDisk.length > 0) {
      _cachedProducts = fromDisk;
      _cachedTime = now;
      if (typeof globalThis !== 'undefined' && globalThis.__sevayaProductsCache) {
        globalThis.__sevayaProductsCache.products = fromDisk;
        globalThis.__sevayaProductsCache.timestamp = now;
      }
      return fromDisk;
    }
  }

  // 1. Cek shared globalThis cache di Node.js server
  if (typeof globalThis !== 'undefined' && globalThis.__sevayaProductsCache?.products && !forceRefresh) {
    if (now - globalThis.__sevayaProductsCache.timestamp < CACHE_TTL_MS) {
      _cachedProducts = globalThis.__sevayaProductsCache.products;
      _cachedTime = globalThis.__sevayaProductsCache.timestamp;
      return _cachedProducts;
    }
  }

  if (!forceRefresh && _cachedProducts && now - _cachedTime < CACHE_TTL_MS) {
    return _cachedProducts as DbProduct[];
  }

  // When forcing refresh, clear localStorage so stale data never serves as fallback
  if (forceRefresh && typeof window !== 'undefined') {
    try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
    _cachedProducts = null;
    _cachedTime = 0;
  }

  // 2. In browser: check localStorage for instant fallback (only when NOT force refreshing)
  if (!forceRefresh && typeof window !== 'undefined' && !_cachedProducts) {
    const lsData = loadFromLocalStorage();
    if (lsData && lsData.length > 0) {
      _cachedProducts = lsData;
      _cachedTime = now;
    }
  }

  // 3. Fetch fresh catalog — always bypass browser HTTP cache
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/products', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.products) && json.products.length > 0) {
          _cachedProducts = json.products as DbProduct[];
          _cachedTime = Date.now();
          saveToLocalStorage(json.products);
          return json.products as DbProduct[];
        }
      }
    } catch {
      // Fallback to storage or cache
    }
  }

  // 4. Server or direct fetch: Cloud Storage JSON file (where live catalog is maintained)
  try {
    const fetchStorage = async () => {
      const { data, error } = await supabase.storage
        .from('catalog')
        .download(PRODUCTS_FILE);
      return { data, error };
    };

    const timeoutStorage = new Promise<{ data: null; error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error('Storage Timeout') }), 1500)
    );

    const { data: fileData, error: fileError } = (await Promise.race([
      fetchStorage(),
      timeoutStorage,
    ])) as { data: Blob | null; error: Error | null };

    if (!fileError && fileData) {
      const text = await fileData.text();
      const parsed = JSON.parse(text) as DbProduct[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        _cachedProducts = parsed;
        _cachedTime = Date.now();
        saveToLocalStorage(parsed);
        return _cachedProducts;
      }
    }
  } catch {
    // Ignore and fallback below
  }

  // 5. Fallback to localStorage or code defaults
  const lsData = loadFromLocalStorage();
  if (lsData && lsData.length > 0) {
    _cachedProducts = lsData;
    _cachedTime = Date.now();
    return _cachedProducts;
  }

  _cachedProducts = DEFAULT_DB_PRODUCTS;
  _cachedTime = Date.now();
  return DEFAULT_DB_PRODUCTS;
}

/**
 * Create a new product.
 */
export async function createDbProduct(product: Omit<DbProduct, 'id'>): Promise<DbProduct> {
  const current = await getDbProducts();
  const newId = String(Date.now());
  const newProduct: DbProduct = {
    ...product,
    id: newId,
  };

  // 1. Try to insert into PostgreSQL table
  try {
    await supabase.from('products').insert([newProduct]);
  } catch {
    // Table might not exist yet
  }

  // 2. Save to Cloud Storage JSON + localStorage
  const updated = [newProduct, ...current];
  _cachedProducts = updated;
  _cachedTime = Date.now();
  await syncProductsToCloudStorage(updated);

  return newProduct;
}

/**
 * Update an existing product.
 */
export async function updateDbProduct(
  id: string | number,
  updates: Partial<DbProduct>,
): Promise<DbProduct | null> {
  const current = await getDbProducts();
  const index = current.findIndex((p) => String(p.id) === String(id));
  if (index === -1) return null;

  const updatedProduct = {
    ...current[index],
    ...updates,
  } as DbProduct;

  current[index] = updatedProduct;

  // 1. Try to update PostgreSQL table
  try {
    await supabase.from('products').update(updates).eq('id', id);
  } catch {
    // Table might not exist yet
  }

  // 2. Save to Cloud Storage JSON + localStorage, update cache immediately
  _cachedProducts = current;
  _cachedTime = Date.now();
  await syncProductsToCloudStorage(current);

  return updatedProduct;
}

/**
 * Delete a product by ID.
 */
export async function deleteDbProduct(id: string | number): Promise<boolean> {
  const current = await getDbProducts();
  const filtered = current.filter((p) => String(p.id) !== String(id));

  // 1. Try to delete from PostgreSQL table
  try {
    await supabase.from('products').delete().eq('id', id);
  } catch {
    // Table might not exist yet
  }

  // 2. Save to Cloud Storage JSON + localStorage, update cache immediately
  _cachedProducts = filtered;
  _cachedTime = Date.now();
  await syncProductsToCloudStorage(filtered);

  return true;
}
