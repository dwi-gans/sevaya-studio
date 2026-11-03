import React, { Suspense } from 'react';
import { fetchCatalogProducts } from '@/features/catalog';
import { ShopClient } from '@/components/shop/ShopClient';

export const dynamic = 'force-dynamic';

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
