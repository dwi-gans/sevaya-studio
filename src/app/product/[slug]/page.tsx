import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDbProducts, DEFAULT_DB_PRODUCTS, DbProduct } from '@/integrations/supabase';
import { ProductDetailClient } from '@/components/product/ProductDetailClient';
import { getServerInventoryVariants } from '@/lib/inventory-server';
import { publicEnv } from '@/config/env';

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const products = await getDbProducts(true).catch(() => []);

  let product: DbProduct | undefined = products.find(
    (p) =>
      p.slug.toLowerCase() === decodedSlug.toLowerCase() ||
      String(p.id) === decodedSlug
  );

  if (!product) {
    product = DEFAULT_DB_PRODUCTS.find((p) => p.slug === decodedSlug);
  }

  const titleFallback = decodedSlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const title = product?.title || titleFallback;
  const description =
    product?.description ||
    `Koleksi busana ${title} eksklusif dari SEVAYA Studio. Dibuat dengan material cupro silk premium, siluet mengalir elegan dan nyaman untuk gaya modest modern.`;
  const image = product?.image || '/images/og-image.jpg';
  const siteUrl = publicEnv.siteUrl || 'https://sevaya-studio.com';
  const canonicalUrl = `${siteUrl}/product/${encodeURIComponent(decodedSlug)}`;

  return {
    title: `${title} — Abaya Cupro Premium`,
    description,
    keywords: [
      title,
      `${title} Abaya`,
      'Abaya Cupro',
      'Abaya Silk',
      'SEVAYA Abaya',
      'Savaya Abaya',
      'Beli Abaya Online',
      'Abaya Premium Indonesia',
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} — Abaya Cupro Premium | SEVAYA`,
      description,
      url: canonicalUrl,
      images: [
        {
          url: image.startsWith('http') ? image : `${siteUrl}${image}`,
          width: 800,
          height: 1000,
          alt: `${title} by SEVAYA`,
        },
      ],
      type: 'website',
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const [products, allVariants] = await Promise.all([
    getDbProducts(true),
    getServerInventoryVariants(),
  ]);

  let product: DbProduct | undefined = products.find(
    (p) =>
      p.slug.toLowerCase() === decodedSlug.toLowerCase() ||
      String(p.id) === decodedSlug
  );

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

  const productVariants = allVariants.filter(
    (v) =>
      v.productSlug === decodedSlug ||
      (product && String(v.productId) === String(product.id))
  );

  const siteUrl = publicEnv.siteUrl || 'https://sevaya-studio.com';
  const productImages =
    product.images && product.images.length > 0 ? product.images : [product.image];

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description:
      product.description ||
      `Koleksi busana ${product.title} eksklusif dari SEVAYA Studio. Dibuat dengan material cupro silk premium.`,
    image: productImages.map((img) =>
      img.startsWith('http') ? img : `${siteUrl}${img}`
    ),
    brand: {
      '@type': 'Brand',
      name: 'SEVAYA',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'IDR',
      price: product.price || 1339000,
      availability: 'https://schema.org/InStock',
      url: `${siteUrl}/product/${encodeURIComponent(decodedSlug)}`,
      seller: {
        '@type': 'Organization',
        name: 'SEVAYA Studio',
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductDetailClient
        slug={decodedSlug}
        initialProduct={product}
        initialVariants={productVariants}
      />
    </>
  );
}
