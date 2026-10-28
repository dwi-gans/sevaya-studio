'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const isCustomHeader = isAdmin || pathname.startsWith('/profile');

  return (
    <div className={`flex flex-1 flex-col bg-white text-black ${isCustomHeader ? 'pt-0' : 'pt-16'}`}>
      {children}
    </div>
  );
}
