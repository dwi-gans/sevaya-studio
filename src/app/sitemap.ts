import type { MetadataRoute } from 'next';
import { publicEnv } from '@/config/env';
import { getDbProducts } from '@/integrations/supabase';
import { getArticles } from '@/integrations/supabase/articles';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = publicEnv.siteUrl || 'https://sevaya-studio.com';
  const now = new Date();

  // Halaman statis utama storefront
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/lookbook`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/conscious`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ];

  // Rute dinamis: Semua Produk Abaya & Khimar
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await getDbProducts();
    productRoutes = products
      .filter((p) => !p.hidden && p.slug)
      .map((p) => ({
        url: `${baseUrl}/product/${p.slug}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.9,
      }));
  } catch (err) {
    console.warn('Sitemap: Failed to load products for sitemap', err);
  }

  // Rute dinamis: Semua Artikel Jurnal/News
  let articleRoutes: MetadataRoute.Sitemap = [];
  try {
    const articles = await getArticles();
    articleRoutes = articles
      .filter((a) => a.published && a.slug)
      .map((a) => ({
        url: `${baseUrl}/news/${a.slug}`,
        lastModified: a.updated_at ? new Date(a.updated_at) : now,
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
  } catch (err) {
    console.warn('Sitemap: Failed to load articles for sitemap', err);
  }

  return [...staticRoutes, ...productRoutes, ...articleRoutes];
}
