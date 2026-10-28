'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';

function OrdersRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/profile?tab=orders');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3.5 text-center">
        <div className="relative flex h-10 w-10 items-center justify-center">
          <div className="absolute h-full w-full animate-ping rounded-full bg-black/10" />
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
        </div>
        <p className="font-headline text-xs tracking-widest text-black/70 uppercase animate-pulse">
          Membuka Riwayat Pesanan...
        </p>
      </div>
    </div>
  );
}

export default function ProfileOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="relative flex h-10 w-10 items-center justify-center">
            <div className="absolute h-full w-full animate-ping rounded-full bg-black/10" />
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
          </div>
        </div>
      }
    >
      <OrdersRedirect />
    </Suspense>
  );
}
