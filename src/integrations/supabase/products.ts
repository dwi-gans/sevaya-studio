import { supabase } from './client';

export interface ProductSwatch {
  name: string;
  color: string;
  image?: string; // photo representing this specific color
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
    id: '1',
    slug: 'fina-abaya-stripe-2',
    title: 'Fina Abaya - Stripe Edition 2.0',
    category: 'abaya',
    edition: 'Edition 2.0',
    price: 1489000,
    original_price: 1489000,
    badge: 'Best Seller',
    image: '/images/catalog/catalog-01.jpg',
    images: ['/images/catalog/catalog-01.jpg', '/images/catalog/catalog-06.jpg', '/images/catalog/catalog-08.jpg'],
    inStock: true,
    hidden: false,
    swatches: [
      { name: 'Black', color: '#1A1A1A', image: '/images/catalog/catalog-01.jpg' },
      { name: 'Garnet', color: '#6B2D2B', image: '/images/catalog/catalog-06.jpg' },
      { name: 'Caramel', color: '#C68B59', image: '/images/catalog/catalog-08.jpg' },
      { name: 'Peach', color: '#E5A894', image: '/images/catalog/catalog-01.jpg' },
    ],
  },
  {
    id: '2',
    slug: 'fina-abaya-1',
    title: 'Tala Abaya - Rhapsody',
    category: 'abaya',
    edition: 'Classic Cupro Silk',
    price: 1339000,
    badge: 'New',
    image: '/images/catalog/catalog-03.jpg',
    images: ['/images/catalog/catalog-03.jpg', '/images/catalog/catalog-05.jpg'],
    inStock: true,
    hidden: false,
    swatches: [
      { name: 'Black', color: '#202020', image: '/images/catalog/catalog-03.jpg' },
      { name: 'Navy', color: '#1C2833', image: '/images/catalog/catalog-05.jpg' },
      { name: 'Dark Choco', color: '#4A2E1B', image: '/images/catalog/catalog-03.jpg' },
      { name: 'Olive Brown', color: '#5D5341', image: '/images/catalog/catalog-05.jpg' },
    ],
  },
  {
    id: '3',
    slug: 'tala-abaya-cloudmatte',
    title: 'Sevilla Cupro - Abaya',
    category: 'abaya',
    edition: 'Cloudmatte Bemberg',
    price: 1359200,
    original_price: 1699000,
    badge: 'Sale -20%',
    image: '/images/catalog/catalog-18.jpg',
    images: ['/images/catalog/catalog-18.jpg', '/images/catalog/catalog-17.jpg'],
    inStock: true,
    hidden: false,
    swatches: [
      { name: 'Emerald', color: '#2E5A44', image: '/images/catalog/catalog-18.jpg' },
      { name: 'Brown Taupe', color: '#4C3B32', image: '/images/catalog/catalog-17.jpg' },
      { name: 'Dove Grey', color: '#A29A90', image: '/images/catalog/catalog-18.jpg' },
      { name: 'Bay Leaf', color: '#7D8876', image: '/images/catalog/catalog-17.jpg' },
    ],
  },
  {
    id: '4',
    slug: 'fina-abaya-stripe-oatmeal',
    title: 'Fina Abaya - Oatmeal Stripe',
    category: 'abaya',
    edition: 'Summer Light Stripe',
    price: 1339000,
    image: '/images/catalog/catalog-13.jpg',
    images: ['/images/catalog/catalog-13.jpg', '/images/catalog/catalog-14.jpg'],
    inStock: true,
    hidden: false,
    swatches: [
      { name: 'Black Stripe', color: '#2C2B29', image: '/images/catalog/catalog-13.jpg' },
      { name: 'Oatmeal Stripe', color: '#C2B8AA', image: '/images/catalog/catalog-14.jpg' },
      { name: 'Clay Stripe', color: '#8C675B', image: '/images/catalog/catalog-13.jpg' },
    ],
  },
  {
    id: '5',
    slug: 'amani-modest-abaya-sage',
    title: 'Amani Modest Abaya - Sage',
    category: 'abaya',
    edition: 'Soft Earth Tones',
    price: 1339000,
    image: '/images/catalog/catalog-05.jpg',
    images: ['/images/catalog/catalog-05.jpg', '/images/catalog/catalog-06.jpg'],
    inStock: true,
    hidden: false,
    swatches: [
      { name: 'Sage Green', color: '#889A84', image: '/images/catalog/catalog-05.jpg' },
      { name: 'Black', color: '#1A1A1A', image: '/images/catalog/catalog-06.jpg' },
      { name: 'Rose', color: '#DBA8A0', image: '/images/catalog/catalog-05.jpg' },
    ],
  },
  {
    id: '6',
    slug: 'tala-french-khimar',
    title: 'Tala French Khimar - Cloudmatte',
    category: 'khimar',
    edition: 'Cloudmatte Finish',
    price: 789000,
    badge: 'Trending',
    image: '/images/khiban-banner-v2.jpg',
    images: ['/images/khiban-banner-v2.jpg'],
    inStock: true,
    hidden: false,
    swatches: [
      { name: 'Black', color: '#1A1A1A', image: '/images/khiban-banner-v2.jpg' },
      { name: 'Mocha', color: '#B28E78', image: '/images/khiban-banner-v2.jpg' },
    ],
  },
  {
    id: '7',
    slug: 'luna-essential-khimar',
    title: 'Luna Essential Khimar & Veil',
    category: 'khimar',
    edition: 'Minimalist Silhouette',
    price: 689000,
    image: '/images/catalog/catalog-10.jpg',
    images: ['/images/catalog/catalog-10.jpg', '/images/catalog/catalog-09.jpg'],
    inStock: true,
    hidden: false,
    swatches: [
      { name: 'Grey', color: '#4A4E53', image: '/images/catalog/catalog-10.jpg' },
      { name: 'Black', color: '#1A1A1A', image: '/images/catalog/catalog-09.jpg' },
      { name: 'Cream', color: '#E5D6C5', image: '/images/catalog/catalog-10.jpg' },
    ],
  },
  {
    id: '8',
    slug: 'nour-luxury-khimar',
    title: 'Nour Luxury Flowing Khimar',
    category: 'khimar',
    edition: 'Fluid Floor Sweep',
    price: 849000,
    image: '/images/catalog/catalog-15.jpg',
    images: ['/images/catalog/catalog-15.jpg', '/images/catalog/catalog-16.jpg'],
    inStock: true,
    hidden: false,
    swatches: [
      { name: 'Espresso', color: '#3A271E', image: '/images/catalog/catalog-15.jpg' },
      { name: 'Black', color: '#1A1A1A', image: '/images/catalog/catalog-16.jpg' },
      { name: 'Camel', color: '#A98263', image: '/images/catalog/catalog-15.jpg' },
    ],
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
