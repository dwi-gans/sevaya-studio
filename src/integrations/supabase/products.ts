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
    title: 'Fina Abaya - Stripe 2.0',
    edition: 'Edition 2.0',
    price: 1339000,
    original_price: 1489000,
    image: '/images/catalog/catalog-01.jpg',
    inStock: true,
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
    title: 'Fina Abaya 1.0',
    edition: 'Classic 1.0',
    price: 1339000,
    badge: 'Best Seller',
    image: '/images/catalog/catalog-03.jpg',
    inStock: true,
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
    title: 'Tala Abaya (Cloudmatte)',
    edition: 'Cloudmatte Bemberg',
    price: 1359200,
    original_price: 1699000,
    badge: 'Sale -20%',
    image: '/images/catalog/catalog-18.jpg',
    inStock: true,
    swatches: [
      { name: 'Emerald', color: '#2E5A44', image: '/images/catalog/catalog-18.jpg' },
      { name: 'Brown Taupe', color: '#4C3B32', image: '/images/catalog/catalog-17.jpg' },
      { name: 'Dove Grey', color: '#A29A90', image: '/images/catalog/catalog-16.jpg' },
      { name: 'Bay Leaf', color: '#7D8876', image: '/images/catalog/catalog-15.jpg' },
    ],
  },
  {
    id: '4',
    slug: 'fina-abaya-stripe-2',
    title: 'Fina Abaya - Stripe Edition',
    edition: 'Summer Light Stripe',
    price: 1339000,
    image: '/images/catalog/catalog-13.jpg',
    inStock: true,
    swatches: [
      { name: 'Black Stripe', color: '#2C2B29', image: '/images/catalog/catalog-13.jpg' },
      { name: 'Oatmeal Stripe', color: '#C2B8AA', image: '/images/catalog/catalog-04.jpg' },
      { name: 'Clay Stripe', color: '#8C675B', image: '/images/catalog/catalog-02.jpg' },
    ],
  },
];

const PRODUCTS_FILE = 'products.json';

/**
 * Saves current products list to Supabase Storage JSON cloud sync.
 */
async function syncProductsToCloudStorage(products: DbProduct[]): Promise<void> {
  try {
    const jsonStr = JSON.stringify(products, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    await supabase.storage.from('catalog').upload(PRODUCTS_FILE, blob, {
      contentType: 'application/json',
      upsert: true,
    });
  } catch {
    // Ignore storage sync errors
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

    _cachedProducts = DEFAULT_DB_PRODUCTS;
    _cachedTime = Date.now();
    return DEFAULT_DB_PRODUCTS;
  } catch {
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

  // 2. Save to Cloud Storage JSON
  const updated = [newProduct, ...current];
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

  // 2. Save to Cloud Storage JSON
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

  // 2. Save to Cloud Storage JSON
  await syncProductsToCloudStorage(filtered);

  return true;
}
