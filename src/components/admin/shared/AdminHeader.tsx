'use client';

import React from 'react';
import Link from 'next/link';
import { PanelLeft, Store } from 'lucide-react';
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
      className={`fixed top-0 right-0 h-14 sm:h-16 bg-[#faf9f7] backdrop-blur-xl border-b border-[#e6e2dc] z-40 px-3 sm:px-5 lg:px-6 xl:px-8 flex items-center justify-between gap-2.5 sm:gap-3 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isSidebarOpen ? 'left-0 md:left-[260px]' : 'left-0'
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-xl">
        {/* Tombol Menu Mobile: PanelLeft */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex h-10 w-10 items-center justify-center bg-white border border-[#d6d1c9] rounded-[2px] text-[#1a1a1a] hover:border-[#1a1a1a] active:scale-95 transition shrink-0 md:hidden cursor-pointer"
          aria-label="Buka Menu Admin"
          title="Buka Menu Admin"
        >
          <PanelLeft className="w-[18px] h-[18px] stroke-[1.6]" />
        </button>

        {/* Tombol Toggle Sidebar Desktop: PanelLeft */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="hidden md:flex h-10 w-10 items-center justify-center bg-white border border-[#d6d1c9] rounded-[2px] text-[#1a1a1a] hover:border-[#1a1a1a] active:scale-95 transition shrink-0 cursor-pointer"
          aria-label="Toggle Menu Sidebar"
          title={isSidebarOpen ? 'Sembunyikan Sidebar' : 'Buka Sidebar'}
        >
          <PanelLeft className="w-[18px] h-[18px] stroke-[1.6]" />
        </button>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/"
          target="_blank"
          className="flex h-10 w-10 items-center justify-center bg-white border border-[#d6d1c9] rounded-[2px] text-[#1a1a1a] hover:border-[#1a1a1a] active:scale-95 transition shrink-0 cursor-pointer"
          title="Lihat Toko Publik"
        >
          <Store className="w-[18px] h-[18px] stroke-[1.6]" />
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
