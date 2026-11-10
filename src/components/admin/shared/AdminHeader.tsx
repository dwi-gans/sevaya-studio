'use client';

import React from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { AdminTab } from '../adminTypes';

interface AdminHeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setIsMobileMenuOpen: (open: boolean) => void;
  activeTab: AdminTab;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
}

export function AdminHeader({
  isSidebarOpen,
  toggleSidebar,
  setIsMobileMenuOpen,
  activeTab,
}: AdminHeaderProps) {
  return (
    <header
      className={`fixed top-0 right-0 h-14 sm:h-16 bg-white/95 backdrop-blur-xl border-b border-[#d5c2c5]/30 z-40 px-3 sm:px-5 lg:px-6 xl:px-8 flex items-center justify-between gap-2.5 sm:gap-3 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isSidebarOpen ? 'left-0 md:left-[260px]' : 'left-0'
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-xl">
        {/* Tombol Menu Mobile: Garis 3 (Hamburger) Selalu Tampil di Mobile */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-none border border-black/20 bg-white text-black hover:bg-black hover:text-white hover:border-black active:scale-95 transition-all duration-200 shrink-0 md:hidden cursor-pointer"
          aria-label="Buka Menu Admin"
          title="Buka Menu Admin"
        >
          <Icon name="menu" size={20} />
        </button>

        {/* Tombol Toggle Sidebar Desktop */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="group relative hidden md:flex h-10 w-10 items-center justify-center rounded-none border border-black/20 bg-white text-black hover:bg-black hover:text-white hover:border-black active:scale-95 transition-all duration-300 shrink-0 cursor-pointer"
          aria-label="Toggle Menu Sidebar"
          title={isSidebarOpen ? 'Sembunyikan Sidebar' : 'Buka Sidebar'}
        >
          <div className="relative flex h-[14px] w-[18px] flex-col justify-between items-start overflow-hidden">
            {/* Bar 1 (Top line) */}
            <span
              className={`h-[1.5px] bg-current transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isSidebarOpen
                  ? 'w-[18px] translate-y-[6.25px] rotate-45'
                  : 'w-[18px] translate-y-0 rotate-0 group-hover:w-3'
              }`}
            />
            {/* Bar 2 (Middle line) */}
            <span
              className={`h-[1.5px] bg-current transition-all duration-200 ease-out ${
                isSidebarOpen
                  ? 'w-0 opacity-0 -translate-x-3'
                  : 'w-3 group-hover:w-[18px] opacity-100 translate-x-0'
              }`}
            />
            {/* Bar 3 (Bottom line) */}
            <span
              className={`h-[1.5px] bg-current transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isSidebarOpen
                  ? 'w-[18px] -translate-y-[6.25px] -rotate-45'
                  : 'w-[18px] translate-y-0 rotate-0 group-hover:w-3'
              }`}
            />
          </div>
        </button>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/"
          target="_blank"
          className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-black/15 bg-white text-black hover:bg-black/5 active:scale-95 transition-colors"
          title="Lihat Toko Publik"
        >
          <Icon name="storefront" size={15} />
        </Link>
        {activeTab === 'settings' && (
          <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-emerald-50 border border-emerald-200/60 text-[11px] font-medium text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="hidden xs:inline">Supabase CDN Active</span>
            <span className="xs:hidden">CDN</span>
          </div>
        )}
      </div>
    </header>
  );
}
