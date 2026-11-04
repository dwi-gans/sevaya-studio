import { notFound } from 'next/navigation';
import { getDbProducts, DEFAULT_DB_PRODUCTS, DbProduct } from '@/integrations/supabase';
import { ProductDetailClient } from '@/components/product/ProductDetailClient';

export const revalidate = 0;

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const products = await getDbProducts(true);
  let product: DbProduct | undefined = products.find((p) => p.slug === decodedSlug);

  if (!product) {
    product = DEFAULT_DB_PRODUCTS.find((p) => p.slug === decodedSlug);
  }

  if (!product) {
    const titleFallback = decodedSlug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    product = {
      id: decodedSlug,
      slug: decodedSlug,
      title: titleFallback,
      price: 1339000,
      image: '/images/catalog/catalog-01.jpg',
      images: ['/images/catalog/catalog-01.jpg'],
      swatches: [
        { name: 'Black', color: '#1C1C1E', image: '/images/catalog/catalog-01.jpg' },
        { name: 'Navy', color: '#1B263B', image: '/images/catalog/catalog-05.jpg' },
        { name: 'Espresso', color: '#3E2A20', image: '/images/catalog/catalog-07.jpg' },
        { name: 'Olive Brown', color: '#8C857B', image: '/images/catalog/catalog-04.jpg' },
      ],
    };
  }

  return <ProductDetailClient slug={decodedSlug} initialProduct={product} />;
}
