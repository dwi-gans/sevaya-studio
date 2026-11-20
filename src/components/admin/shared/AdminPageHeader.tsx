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
    <header className="sticky top-0 z-30 bg-[#faf9f7] border-b border-[#e6e2dc] min-h-[72px] sm:min-h-[76px] px-4 sm:px-8 lg:px-10 py-3.5 sm:py-4 flex items-center flex-wrap gap-3 sm:gap-4 transition-colors">
      {/* Tombol hide / show sidebar (PanelLeft) */}
      <button
        type="button"
        onClick={() => {
          if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setIsMobileMenuOpen?.(true);
          } else {
            toggleSidebar?.();
          }
        }}
        className="w-10 h-10 flex items-center justify-center bg-white border border-[#d6d1c9] rounded-[2px] text-[#1a1a1a] hover:border-[#1a1a1a] transition active:scale-95 shrink-0 cursor-pointer"
        aria-controls="sidebar"
        aria-expanded={isSidebarOpen}
        title="Tampilkan / sembunyikan menu"
      >
        <PanelLeft className="w-[18px] h-[18px] stroke-[1.6]" />
        <span className="sr-only">Tampilkan atau sembunyikan menu samping</span>
      </button>

      {/* Judul & Subtitle — font heading proporsional, mewah, dan elegan */}
      <div className="flex-1 min-w-[200px]">
        <h1 className="text-xl sm:text-2xl font-semibold leading-tight text-[#1a1a1a] tracking-tight m-0">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-[13px] text-[#6b655e] mt-1 m-0">
            {subtitle}
          </p>
        )}
      </div>

      {/* Aksi di kanan */}
      <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 shrink-0">
        {children}

        {showStoreLink && (
          <Link
            href="/"
            target="_blank"
            className="w-10 h-10 flex items-center justify-center bg-white border border-[#d6d1c9] rounded-[2px] text-[#1a1a1a] hover:border-[#1a1a1a] transition active:scale-95 shrink-0 cursor-pointer"
            aria-label="Lihat toko"
            title="Lihat toko publik"
          >
            <Store className="w-[18px] h-[18px] stroke-[1.6]" />
          </Link>
        )}
      </div>
    </header>
  );
}
