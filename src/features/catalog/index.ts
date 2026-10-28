import {
  getDbProducts,
  createDbProduct,
  updateDbProduct,
  deleteDbProduct,
  DbProduct,
} from '@/integrations/supabase';
import { Product } from '@/components/home/ProductCard';

export function mapDbProductToProduct(item: DbProduct): Product {
  const fallbackImage = item.image || '/images/catalog/catalog-01.jpg';
  return {
    id: String(item.id),
    slug: item.slug || 'fina-abaya-stripe-2',
    title: item.title,
    edition: item.edition || '',
    price: Number(item.price),
    originalPrice: item.original_price ? Number(item.original_price) : undefined,
    badge: item.badge || undefined,
    image: fallbackImage,
    images: item.images,
    swatches:
      item.swatches && item.swatches.length > 0
        ? item.swatches.map((s) => ({
            name: s.name,
            color: s.color,
            image: s.image || fallbackImage,
          }))
        : [
            { name: 'Black', color: '#1A1A1A', image: fallbackImage },
            { name: 'Garnet', color: '#6B2D2B', image: fallbackImage },
          ],
  };
}

export async function fetchCatalogProducts(): Promise<Product[]> {
  const dbItems = await getDbProducts();
  // Filter out products that are explicitly hidden from the storefront
  return dbItems.filter((p) => !p.hidden).map(mapDbProductToProduct);
}

export async function addCatalogProduct(product: Omit<DbProduct, 'id'>): Promise<Product> {
  const created = await createDbProduct(product);
  return mapDbProductToProduct(created);
}

export async function editCatalogProduct(
  id: string | number,
  updates: Partial<DbProduct>,
): Promise<Product | null> {
  const updated = await updateDbProduct(id, updates);
  return updated ? mapDbProductToProduct(updated) : null;
}

export async function removeCatalogProduct(id: string | number): Promise<boolean> {
  return deleteDbProduct(id);
}
