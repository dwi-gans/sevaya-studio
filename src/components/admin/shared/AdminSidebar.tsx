'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Icon } from '@/components/ui/Icon';
import { AdminTab, ADMIN_NAV_GROUPS } from '../adminTypes';

interface AdminSidebarProps {
  isSidebarOpen: boolean;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  productsCount: number;
  articlesCount: number;
  onLogout: () => void;
}

export function AdminSidebar({
  isSidebarOpen,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  activeTab,
  setActiveTab,
  productsCount,
  articlesCount,
  onLogout,
}: AdminSidebarProps) {
  const getBadge = (itemId: AdminTab) => {
    switch (itemId) {
      case 'orders':
        return 12;
      case 'catalog':
        return productsCount || 4;
      case 'section-news':
        return articlesCount || 6;
      case 'media':
        return '18';
      default:
        return null;
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex fixed left-0 top-0 h-full w-[260px] bg-white border-r border-[#d5c2c5]/30 z-50 flex-col justify-between transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isSidebarOpen
            ? 'translate-x-0 opacity-100 shadow-[8px_0_36px_rgba(26,28,28,0.06)]'
            : '-translate-x-full opacity-0 pointer-events-none shadow-none'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Header Brand */}
          <div className="p-4 border-b border-black/15/70 flex items-center">
            <Link href="/admin" className="flex items-center" aria-label="Admin Home">
              <Logo className="h-5 w-auto text-black" />
            </Link>
          </div>

          {/* Navigation Groups */}
          <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5 no-scrollbar">
            {ADMIN_NAV_GROUPS.map((group) => (
              <div key={group.groupTitle} className="space-y-1">
                <p className="px-2 pb-1 font-sans text-[10.5px] font-bold text-[#514346] uppercase tracking-wider">
                  {group.groupTitle}
                </p>
                <nav className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = activeTab === item.id;
                    const badge = getBadge(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 text-left transition-colors font-sans text-[13px] ${
                          isActive
                            ? 'bg-[#1a1c1c] text-white font-semibold shadow-xs'
                            : 'text-[#514346] hover:bg-[#eeeeed] hover:text-[#1a1c1c]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon name={item.icon} size={18} className="shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {badge !== null && (
                          <span
                            className={`px-1.5 py-0.5 font-mono text-[11px] shrink-0 ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-[#e8e8e7] text-[#1a1c1c]'
                            }`}
                          >
                            {badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Sidebar: User Profile & Actions */}
        <div className="p-3 border-t border-[#d5c2c5]/20 bg-[#f3f4f3]/40 flex flex-col gap-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-2.5 py-1.5 border border-[#d5c2c5]/40 bg-white text-[#1a1c1c] hover:bg-[#eeeeed] transition-colors text-[11px] font-sans font-bold uppercase tracking-wider"
          >
            <span className="flex items-center gap-1.5">
              <Icon name="storefront" size={14} />
              <span>Lihat Toko Publik</span>
            </span>
            <Icon name="north_east" size={14} />
          </Link>

          <div className="flex items-center gap-2 pt-1">
            <div className="w-8 h-8 bg-[#1a1c1c] text-white flex items-center justify-center shrink-0">
              <Icon name="person" size={18} />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-sans text-[12px] font-semibold text-[#1a1c1c] truncate">
                Sevaya Admin
              </span>
              <span className="font-sans text-[11px] text-[#514346] truncate">
                admin@sevaya.id
              </span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              title="Keluar Sesi Admin"
              className="text-[#514346] hover:text-red-700 transition-colors p-1 cursor-pointer"
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Off-Canvas Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-[#1a1c1c]/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <aside className="fixed inset-y-0 left-0 flex w-[85vw] max-w-xs flex-col justify-between border-r border-[#d5c2c5]/30 bg-white p-5 shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] animate-drawer-slide-in rounded-none z-10 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-[#d5c2c5]/20 pb-4">
                <div className="flex flex-col gap-0.5">
                  <Logo className="h-5 w-auto text-[#1a1c1c]" />
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-none border border-black/20 text-[#1a1c1c] hover:bg-black hover:text-white active:scale-95 transition"
                  aria-label="Tutup Menu"
                >
                  <Icon name="close" size={20} />
                </button>
              </div>

              {/* Drawer Nav Groups */}
              <nav className="mt-5 space-y-5">
                {ADMIN_NAV_GROUPS.map((group) => (
                  <div key={group.groupTitle} className="space-y-1">
                    <p className="px-2 text-[10px] font-bold tracking-wider text-[#514346] uppercase">
                      {group.groupTitle}
                    </p>
                    {group.items.map((item) => {
                      const isActive = activeTab === item.id;
                      const badge = getBadge(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveTab(item.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-3 text-left text-[13px] font-sans transition-all rounded-lg ${
                            isActive
                              ? 'bg-[#1a1c1c] text-white font-semibold shadow-xs'
                              : 'text-[#514346] hover:bg-[#eeeeed] hover:text-[#1a1c1c]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon name={item.icon} size={18} />
                            <span>{item.label}</span>
                          </div>
                          {badge !== null && (
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-[#eeeeed] text-[#1a1c1c]'
                              }`}
                            >
                              {badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </nav>
            </div>

            <div className="flex flex-col gap-2 border-t border-[#d5c2c5]/20 pt-4 mt-6">
              <Link
                href="/"
                target="_blank"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[#d5c2c5]/40 bg-[#f9f9f8] py-2.5 text-xs font-semibold tracking-wider text-[#1a1c1c] uppercase hover:bg-white active:bg-stone-200 transition"
              >
                <Icon name="storefront" size={15} />
                <span>Lihat Toko Publik</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLogout();
                }}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-transparent bg-[#f3f4f3] py-2.5 text-xs font-semibold tracking-wider text-[#514346] uppercase hover:bg-red-50 hover:text-red-700 active:bg-red-100 transition cursor-pointer"
              >
                <Icon name="logout" size={16} />
                <span>Keluar Sesi Admin</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
