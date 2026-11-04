'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

const NO_TOP_PADDING_PREFIXES = [
  '/admin',
  '/profile',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/checkout',
  '/pay',
  '/order-confirmation',
  '/test-checkout',
];

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noTopPadding = NO_TOP_PADDING_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  return (
    <div className={`flex flex-1 flex-col bg-white text-black ${noTopPadding ? 'pt-0' : 'pt-16'}`}>
      {children}
    </div>
  );
}
