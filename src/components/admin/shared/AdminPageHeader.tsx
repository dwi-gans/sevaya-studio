'use client';

import React from 'react';
import Link from 'next/link';
import { PanelLeft, Store } from 'lucide-react';

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
    <header className="sticky top-0 z-30 bg-[#faf9f7] border-b border-[#e6e2dc] min-h-[58px] sm:min-h-[76px] px-3.5 sm:px-8 lg:px-10 py-2.5 sm:py-4 flex items-center justify-between gap-3 transition-colors">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Tombol menu samping (Khusus Mobile - di desktop digantikan toggle chevron > di samping) */}
        <button
          type="button"
          onClick={() => {
            setIsMobileMenuOpen?.(true);
          }}
          className="md:hidden w-9 h-9 flex items-center justify-center bg-white border border-[#d6d1c9] rounded-[2px] text-[#1a1a1a] hover:border-[#1a1a1a] transition active:scale-95 shrink-0 cursor-pointer shadow-xs"
          aria-controls="sidebar"
          title="Buka menu navigasi"
        >
          <PanelLeft className="w-[18px] h-[18px] stroke-[1.6]" />
          <span className="sr-only">Buka menu navigasi</span>
        </button>

        {/* Judul & Subtitle */}
        <div className="min-w-0 flex-1">
          <h1 className="text-base sm:text-2xl font-semibold leading-tight text-[#1a1a1a] tracking-tight truncate m-0">
            {title}
          </h1>
          {subtitle && (
            <p className="hidden sm:block text-xs sm:text-[13px] text-[#6b655e] mt-1 m-0 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Aksi di kanan */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {children}

        {showStoreLink && (
          <Link
            href="/"
            target="_blank"
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white border border-[#d6d1c9] rounded-[2px] text-[#1a1a1a] hover:border-[#1a1a1a] transition active:scale-95 shrink-0 cursor-pointer shadow-xs"
            aria-label="Lihat toko"
            title="Lihat toko publik"
          >
            <Store className="w-4 h-4 sm:w-[18px] sm:h-[18px] stroke-[1.6]" />
          </Link>
        )}
      </div>
    </header>
  );
}
