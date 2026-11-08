import type { MetadataRoute } from 'next';
import { publicEnv } from '@/config/env';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = publicEnv.siteUrl || 'https://sevaya-studio.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/api/*',
          '/checkout',
          '/order-success',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
