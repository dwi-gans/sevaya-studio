import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import { fetchCatalogProducts } from '@/features/catalog';
import { ShopClient } from '@/components/shop/ShopClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Koleksi Busana Abaya & French Khimar Modern',
  description:
    'Jelajahi dan beli koleksi busana abaya eksklusif dari bahan cupro silk dan french khimar modern premium dari SEVAYA Studio. Siluet mengalir anggun, nyaman, dan berkelas.',
  keywords: [
    'Beli Abaya',
    'Koleksi Abaya',
    'Abaya Cupro Silk',
    'French Khimar Modern',
    'Abaya Modern Indonesia',
    'Toko Abaya Online',
    'Abaya Hitam Premium',
    'SEVAYA Shop',
    'Savaya Abaya',
  ],
  alternates: {
    canonical: '/shop',
  },
};

export default async function ShopPage() {
  const initialProducts = await fetchCatalogProducts();

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FFFFFF]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#000000] border-t-transparent" />
        </div>
      }
    >
      <ShopClient initialProducts={initialProducts} />
    </Suspense>
  );
}
