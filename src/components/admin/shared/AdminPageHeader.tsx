'use client';

import React from 'react';
import Link from 'next/link';
import { Store } from 'lucide-react';

export interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  isSidebarOpen?: boolean;
  toggleSidebar?: () => void;
  setIsMobileMenuOpen?: (open: boolean) => void;
  children?: React.ReactNode;
  showStoreLink?: boolean;
}

export function AdminPageHeader({
  title,
  subtitle,
  isSidebarOpen = true,
  toggleSidebar,
  setIsMobileMenuOpen,
  children,
  showStoreLink = true,
}: AdminPageHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#faf9f7] border-b border-[#e6e2dc] min-h-[52px] sm:min-h-[76px] px-3 sm:px-8 lg:px-10 py-2 sm:py-4 flex items-center justify-between gap-2 sm:gap-3 transition-colors">
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">

        {/* Judul & Subtitle */}
        <div className="min-w-0 flex-1 pl-1.5 sm:pl-0">
          <h1 className="text-sm sm:text-2xl font-semibold leading-tight text-[#1a1a1a] tracking-tight truncate m-0">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[9.5px] sm:text-[13px] text-[#6b655e] mt-0.5 m-0 line-clamp-1 sm:line-clamp-none">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Aksi di kanan */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {children}

        {showStoreLink && (
          <Link
            href="/"
            target="_blank"
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white border border-[#d6d1c9] rounded-[2px] text-[#1a1a1a] hover:border-[#1a1a1a] transition active:scale-95 shrink-0 cursor-pointer shadow-xs"
            aria-label="Lihat toko"
            title="Lihat toko publik"
          >
            <Store className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px] stroke-[1.6]" />
          </Link>
        )}
      </div>
    </header>
  );
}
