import React, { useState, useEffect } from 'react';
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
  ordersCount: number;
  productsCount: number;
  articlesCount: number;
  mediaCount: number;
  onLogout: () => void;
}

export function AdminSidebar({
  isSidebarOpen,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  activeTab,
  setActiveTab,
  ordersCount,
  productsCount,
  articlesCount,
  mediaCount,
  onLogout,
}: AdminSidebarProps) {
  // Track read/cleared notification state for tabs (especially orders)
  const [ordersRead, setOrdersRead] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = localStorage.getItem('sevaya_admin_orders_read_count');
      return saved !== null && Number(saved) === ordersCount;
    } catch {
      return false;
    }
  });

  // Whenever orders count increases beyond saved read count, mark as unread
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sevaya_admin_orders_read_count');
      if (saved === null || ordersCount > Number(saved)) {
        if (activeTab === 'orders') {
          // If currently viewing orders, auto-mark as read
          localStorage.setItem('sevaya_admin_orders_read_count', String(ordersCount));
          setOrdersRead(true);
        } else {
          setOrdersRead(false);
        }
      } else {
        setOrdersRead(true);
      }
    } catch {
      // ignore
    }
  }, [ordersCount, activeTab]);

  // When clicking a tab: if user opens 'orders', clear the badge
  const handleTabClick = (tabId: AdminTab) => {
    setActiveTab(tabId);
    if (tabId === 'orders') {
      try {
        localStorage.setItem('sevaya_admin_orders_read_count', String(ordersCount));
      } catch {
        // ignore
      }
      setOrdersRead(true);
    }
  };

  const getBadge = (itemId: AdminTab) => {
    switch (itemId) {
      case 'orders': {
        // 1. If ordersCount is 0, do NOT show 0 badge!
        // 2. If tab is already open or already read by user, hide badge!
        if (!ordersCount || ordersCount <= 0 || ordersRead || activeTab === 'orders') {
          return null;
        }
        return ordersCount;
      }
      case 'catalog': {
        // Only show if positive number and not 0
        return productsCount > 0 ? productsCount : null;
      }
      case 'section-news': {
        // Only show if positive number and not 0
        return articlesCount > 0 ? articlesCount : null;
      }
      case 'media': {
        // Only show if positive number and not 0
        return mediaCount > 0 ? mediaCount : null;
      }
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
                        onClick={() => handleTabClick(item.id)}
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

          {/* Footer User Profile & Logout */}
          <div className="p-3 border-t border-[#d5c2c5]/30 bg-[#f9f9f8] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-full bg-[#1a1c1c] text-white flex items-center justify-center font-bold text-xs shrink-0">
                A
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-sans text-[12px] font-semibold text-[#1a1c1c] truncate">
                  Sevaya Admin
                </span>
                <span className="font-sans text-[10px] text-[#514346] truncate">
                  Master Workspace
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 text-[#514346] hover:text-red-600 hover:bg-white rounded transition-colors"
              title="Keluar Admin"
              aria-label="Logout"
            >
              <Icon name="logout" size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Content */}
      <div
        className={`fixed top-0 bottom-0 left-0 w-[280px] bg-white z-50 shadow-2xl flex flex-col md:hidden transition-transform duration-300 ease-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-black/15 flex items-center justify-between">
          <Link
            href="/admin"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center"
            aria-label="Admin Home"
          >
            <Logo className="h-5 w-auto text-black" />
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="h-8 w-8 flex items-center justify-center rounded-full border border-black/15 text-black hover:bg-black/5"
            aria-label="Tutup Menu"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 no-scrollbar">
          {ADMIN_NAV_GROUPS.map((group) => (
            <div key={group.groupTitle} className="space-y-1">
              <p className="px-2 pb-1 font-sans text-[10px] font-bold text-[#514346] uppercase tracking-wider">
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
                      onClick={() => {
                        handleTabClick(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors font-sans text-[13px] rounded-lg ${
                        isActive
                          ? 'bg-[#1a1c1c] text-white font-semibold'
                          : 'text-[#514346] hover:bg-[#eeeeed] hover:text-[#1a1c1c]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon name={item.icon} size={18} className="shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {badge !== null && (
                        <span
                          className={`px-2 py-0.5 font-mono text-[11px] rounded ${
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
              </nav>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-[#d5c2c5]/30 bg-[#f9f9f8] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#1a1c1c]">Sevaya Admin</span>
          <button
            type="button"
            onClick={onLogout}
            className="text-xs text-red-600 font-medium hover:underline"
          >
            Keluar
          </button>
        </div>
      </div>
    </>
  );
}
