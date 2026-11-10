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
  const isInStock = item.inStock !== false && (typeof item.stock !== 'number' || item.stock > 0);
  return {
    id: String(item.id),
    slug: item.slug || 'fina-abaya-stripe-2',
    title: item.title,
    category:
      item.category ||
      (item.title.toLowerCase().includes('khimar') || item.title.toLowerCase().includes('veil')
        ? 'khimar'
        : 'abaya'),
    edition: item.edition || '',
    price: Number(item.price),
    originalPrice: item.original_price ? Number(item.original_price) : undefined,
    badge: item.badge || undefined,
    image: fallbackImage,
    images: item.images,
    inStock: isInStock,
    stock: typeof item.stock === 'number' ? item.stock : (item.inStock === false ? 0 : 25),
    sizes: item.sizes && item.sizes.length > 0 ? item.sizes : ['S', 'M', 'L', 'XL'],
    fabric: item.fabric,
    material: item.material,
    swatches:
      item.swatches && item.swatches.length > 0
        ? item.swatches.map((s) => ({
            name: s.name,
            color: s.color,
            image: s.image && !s.image.includes('logo_ibey') ? s.image : fallbackImage,
            images: Array.isArray(s.images)
              ? s.images.filter((img) => img && img.trim() !== '' && !img.includes('logo_ibey'))
              : undefined,
          }))
        : [
            { name: 'Black', color: '#1A1A1A', image: fallbackImage },
            { name: 'Garnet', color: '#6B2D2B', image: fallbackImage },
          ],
  };
}

export async function fetchCatalogProducts(): Promise<Product[]> {
  const dbItems = await getDbProducts();
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
