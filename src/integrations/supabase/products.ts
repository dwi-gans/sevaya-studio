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
  edition?: string;
  price: number;
  original_price?: number;
  badge?: string;
  image: string;
  images?: string[];
  swatches: ProductSwatch[];
  description?: string;
  inStock?: boolean;
  hidden?: boolean; // if true, product is hidden from the public storefront
}

export const DEFAULT_DB_PRODUCTS: DbProduct[] = [
  {
    id: '1',
    slug: 'fina-abaya-stripe-2',
    title: 'Fina Abaya - Stripe Edition 2.0',
    edition: 'Edition 2.0',
    price: 1339000,
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
      { name: 'Peach', color: '#E5A894', image: '/images/catalog/catalog-10.jpg' },
    ],
  },
  {
    id: '2',
    slug: 'fina-abaya-1',
    title: 'Tala Abaya - Rhapsody',
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
      { name: 'Dark Choco', color: '#4A2E1B', image: '/images/catalog/catalog-07.jpg' },
      { name: 'Olive Brown', color: '#5D5341', image: '/images/catalog/catalog-09.jpg' },
    ],
  },
  {
    id: '3',
    slug: 'tala-abaya-cloudmatte',
    title: 'Sevilla Cupro - Abaya',
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
      { name: 'Dove Grey', color: '#A29A90', image: '/images/catalog/catalog-16.jpg' },
      { name: 'Bay Leaf', color: '#7D8876', image: '/images/catalog/catalog-15.jpg' },
    ],
  },
  {
    id: '4',
    slug: 'fina-abaya-stripe-oatmeal',
    title: 'Fina Abaya - Oatmeal Stripe',
    edition: 'Summer Light Stripe',
    price: 1339000,
    image: '/images/catalog/catalog-13.jpg',
    images: ['/images/catalog/catalog-13.jpg', '/images/catalog/catalog-14.jpg'],
    inStock: true,
    hidden: false,
    swatches: [
      { name: 'Black Stripe', color: '#2C2B29', image: '/images/catalog/catalog-13.jpg' },
      { name: 'Oatmeal Stripe', color: '#C2B8AA', image: '/images/catalog/catalog-04.jpg' },
      { name: 'Clay Stripe', color: '#8C675B', image: '/images/catalog/catalog-02.jpg' },
    ],
  },
  {
    id: '5',
    slug: 'amani-modest-abaya-sage',
    title: 'Amani Modest Abaya - Sage',
    edition: 'Soft Earth Tones',
    price: 1339000,
    image: '/images/catalog/catalog-05.jpg',
    images: ['/images/catalog/catalog-05.jpg', '/images/catalog/catalog-06.jpg'],
    inStock: true,
    hidden: false,
    swatches: [
      { name: 'Sage Green', color: '#889A84', image: '/images/catalog/catalog-05.jpg' },
      { name: 'Black', color: '#1A1A1A', image: '/images/catalog/catalog-01.jpg' },
      { name: 'Rose', color: '#DBA8A0', image: '/images/catalog/catalog-06.jpg' },
    ],
  },
  {
    id: '6',
    slug: 'tala-french-khimar',
    title: 'Tala French Khimar - Cloudmatte',
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
    edition: 'Minimalist Silhouette',
    price: 689000,
    image: '/images/catalog/catalog-10.jpg',
    images: ['/images/catalog/catalog-10.jpg', '/images/catalog/catalog-09.jpg'],
    inStock: true,
    hidden: false,
    swatches: [
      { name: 'Grey', color: '#4A4E53', image: '/images/catalog/catalog-10.jpg' },
      { name: 'Black', color: '#1A1A1A', image: '/images/catalog/catalog-01.jpg' },
      { name: 'Cream', color: '#E5D6C5', image: '/images/catalog/catalog-03.jpg' },
    ],
  },
  {
    id: '8',
    slug: 'nour-luxury-khimar',
    title: 'Nour Luxury Flowing Khimar',
    edition: 'Fluid Floor Sweep',
    price: 849000,
    image: '/images/catalog/catalog-15.jpg',
    images: ['/images/catalog/catalog-15.jpg', '/images/catalog/catalog-16.jpg'],
    inStock: true,
    hidden: false,
    swatches: [
      { name: 'Espresso', color: '#3A271E', image: '/images/catalog/catalog-15.jpg' },
      { name: 'Black', color: '#1A1A1A', image: '/images/catalog/catalog-01.jpg' },
      { name: 'Camel', color: '#A98263', image: '/images/catalog/catalog-07.jpg' },
    ],
  },
];

const PRODUCTS_FILE = 'products.json';
const LS_KEY = 'sevaya_products_v1';

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
function loadFromLocalStorage(): DbProduct[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DbProduct[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
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

  try {
    if (typeof window !== 'undefined') {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products }),
      });
    }
  } catch {
    // Ignore sync errors
  }
}
let _cachedProducts: DbProduct[] | null = null;
let _cachedTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes in-memory cache for ultra-fast navigation

/**
 * Fetch products with fast in-memory cache & non-blocking timeout fallback.
 */
export async function getDbProducts(): Promise<DbProduct[]> {
  const now = Date.now();
  if (_cachedProducts && now - _cachedTime < CACHE_TTL_MS) {
    return _cachedProducts;
  }

  try {
    // 1. Try PostgreSQL table with 1.2s timeout
    const fetchDb = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });
      return { data, error };
    };

    const timeoutDb = new Promise<{ data: null; error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error('DB Timeout') }), 1200)
    );

    const { data: tableData, error: tableError } = (await Promise.race([
      fetchDb(),
      timeoutDb,
    ])) as { data: DbProduct[] | null; error: Error | null };

    if (!tableError && tableData && tableData.length > 0) {
      _cachedProducts = tableData as DbProduct[];
      _cachedTime = Date.now();
      return _cachedProducts;
    }

    // 2. Try Supabase Cloud Storage sync file with 1.2s timeout
    const fetchStorage = async () => {
      const { data, error } = await supabase.storage
        .from('catalog')
        .download(PRODUCTS_FILE);
      return { data, error };
    };

    const timeoutStorage = new Promise<{ data: null; error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error('Storage Timeout') }), 1200)
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
        return _cachedProducts;
      }
    }

    // 3. Try localStorage (client-side persistent fallback)
    const lsData = loadFromLocalStorage();
    if (lsData) {
      _cachedProducts = lsData;
      _cachedTime = Date.now();
      return _cachedProducts;
    }

    _cachedProducts = DEFAULT_DB_PRODUCTS;
    _cachedTime = Date.now();
    return DEFAULT_DB_PRODUCTS;
  } catch {
    // Try localStorage before giving up
    const lsData = loadFromLocalStorage();
    if (lsData) {
      _cachedProducts = lsData;
      _cachedTime = Date.now();
      return _cachedProducts;
    }
    _cachedProducts = DEFAULT_DB_PRODUCTS;
    _cachedTime = Date.now();
    return DEFAULT_DB_PRODUCTS;
  }
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
