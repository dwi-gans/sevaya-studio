import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Icon } from '@/components/ui/Icon';
import { AdminTab, ADMIN_NAV_GROUPS } from '../adminTypes';

interface AdminSidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar?: () => void;
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
  toggleSidebar,
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

  // Track tabs that the admin has opened/acknowledged
  const [openedTabs, setOpenedTabs] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set(['catalog', 'section-news', 'media']);
    try {
      const saved = localStorage.getItem('sevaya_admin_opened_tabs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return new Set([...parsed, 'catalog', 'section-news', 'media']);
        }
      }
      return new Set(['catalog', 'section-news', 'media']);
    } catch {
      return new Set(['catalog', 'section-news', 'media']);
    }
  });

  // Whenever activeTab changes, auto-mark it as opened and clear unread badge
  useEffect(() => {
    setOpenedTabs((prev) => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      try {
        localStorage.setItem('sevaya_admin_opened_tabs', JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
      return next;
    });
  }, [activeTab]);

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

  // When clicking a tab: mark as opened/read and clear notification badge
  const handleTabClick = (tabId: AdminTab) => {
    setActiveTab(tabId);
    setOpenedTabs((prev) => {
      if (prev.has(tabId)) return prev;
      const next = new Set(prev);
      next.add(tabId);
      try {
        localStorage.setItem('sevaya_admin_opened_tabs', JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
      return next;
    });

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
    // 1. Tab yang sedang aktif dibuka TIDAK PERNAH menampilkan badge notifikasi
    if (activeTab === itemId) {
      return null;
    }

    switch (itemId) {
      case 'orders': {
        // Pesanan adalah notifikasi transaksi real-time
        // Jika sudah dibuka/dibaca atau 0, sembunyikan badge
        if (!ordersCount || ordersCount <= 0 || ordersRead) {
          return null;
        }
        return ordersCount;
      }
      case 'catalog':
      case 'section-news':
      case 'media':
      default:
        // Tab lain (Katalog, Berita, Galeri Media) adalah modul CMS, bukan notifikasi belum dibaca.
        // Setelah dibuka/dilihat oleh admin, badge tidak akan muncul agar tidak membingungkan pengguna.
        return null;
    }
  };

  // Deteksi gestur usap layar di HP (Edge Swipe):
  // Geser dari ujung kiri layar ke kanan untuk memunculkan sidebar,
  // dan geser ke kiri untuk menutup sidebar.
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let isTracking = false;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      if (!isMobileMenuOpen) {
        // Hanya mulai melacak jika sentuhan dimulai dari ujung kiri layar (< 40px)
        if (touch.clientX < 40) {
          startX = touch.clientX;
          startY = touch.clientY;
          isTracking = true;
        }
      } else {
        // Jika sidebar sedang terbuka, sentuhan di mana saja bisa menggeser ke kiri untuk menutup
        startX = touch.clientX;
        startY = touch.clientY;
        isTracking = true;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isTracking) return;
      isTracking = false;

      const touch = e.changedTouches[0];
      if (!touch) return;
      const diffX = touch.clientX - startX;
      const diffY = touch.clientY - startY;

      // Pastikan pergeseran horizontal lebih dominan daripada vertikal
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
        if (!isMobileMenuOpen && diffX > 40) {
          // Geser ke kanan dari ujung kiri -> Buka sidebar
          setIsMobileMenuOpen(true);
        } else if (isMobileMenuOpen && diffX < -40) {
          // Geser ke kiri -> Tutup sidebar
          setIsMobileMenuOpen(false);
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobileMenuOpen, setIsMobileMenuOpen]);

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

      {/* Floating Chevron Sidebar Toggle Button (Desktop) */}
      <button
        type="button"
        onClick={toggleSidebar}
        className={`hidden md:flex fixed top-[42%] -translate-y-1/2 items-center justify-center bg-white border border-[#d6d1c9] shadow-[0_2px_12px_rgba(0,0,0,0.08)] text-[#1a1a1a] hover:bg-[#FAF9F7] active:scale-95 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer z-50 group ${
          isSidebarOpen
            ? 'left-[246px] h-7 w-7 rounded-full'
            : 'left-0 h-12 w-6 rounded-r-lg border-l-0 hover:w-7'
        }`}
        title={isSidebarOpen ? 'Sembunyikan Menu Samping' : 'Tampilkan Menu Samping'}
        aria-label={isSidebarOpen ? 'Sembunyikan Menu Samping' : 'Tampilkan Menu Samping'}
      >
        {isSidebarOpen ? (
          <ChevronLeft className="w-4 h-4 stroke-[2.2] text-[#514346] group-hover:text-black transition-colors" />
        ) : (
          <ChevronRight className="w-4 h-4 stroke-[2.2] text-[#514346] group-hover:text-black transition-colors" />
        )}
      </button>

      {/* Floating Chevron Sidebar Toggle Button (Mobile) - Samakan persis dengan di Desktop */}
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className={`md:hidden fixed top-[42%] -translate-y-1/2 flex items-center justify-center bg-white border border-[#d6d1c9] shadow-[0_2px_12px_rgba(0,0,0,0.12)] text-[#1a1a1a] hover:bg-[#FAF9F7] active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer z-50 group ${
          isMobileMenuOpen
            ? 'left-[266px] h-7 w-7 rounded-full'
            : 'left-0 h-12 w-6 rounded-r-lg border-l-0 hover:w-7'
        }`}
        title={isMobileMenuOpen ? 'Sembunyikan Menu Samping' : 'Tampilkan Menu Samping'}
        aria-label={isMobileMenuOpen ? 'Sembunyikan Menu Samping' : 'Tampilkan Menu Samping'}
      >
        {isMobileMenuOpen ? (
          <ChevronLeft className="w-4 h-4 stroke-[2.2] text-[#514346] group-hover:text-black transition-colors" />
        ) : (
          <ChevronRight className="w-4 h-4 stroke-[2.2] text-[#514346] group-hover:text-black transition-colors" />
        )}
      </button>

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

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 no-scrollbar">
          {ADMIN_NAV_GROUPS.map((group) => (
            <div key={group.groupTitle} className="space-y-1">
              <p className="px-2 pb-1 font-sans text-[9.5px] font-bold text-[#514346] uppercase tracking-wider">
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
                      className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors font-sans text-[12px] rounded-lg ${
                        isActive
                          ? 'bg-[#1a1c1c] text-white font-semibold'
                          : 'text-[#514346] hover:bg-[#eeeeed] hover:text-[#1a1c1c]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon name={item.icon} size={16} className="shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {badge !== null && (
                        <span
                          className={`px-2 py-0.5 font-mono text-[10px] rounded ${
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
          <span className="text-[11px] font-semibold text-[#1a1c1c]">Sevaya Admin</span>
          <button
            type="button"
            onClick={onLogout}
            className="text-[11px] text-red-600 font-medium hover:underline"
          >
            Keluar
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (Akses Cepat 1-Ketukan di Layar HP) */}
      <nav
        aria-label="Navigasi Bawah Mobile"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-black/10 md:hidden flex items-center justify-around h-14 px-1 shadow-[0_-2px_12px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]"
      >
        <button
          type="button"
          onClick={() => handleTabClick('orders')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[9px] font-medium transition active:scale-95 cursor-pointer ${
            activeTab === 'orders' ? 'text-black font-bold' : 'text-black/50 hover:text-black'
          }`}
        >
          <div className="relative">
            <Icon name="receipt_long" size={17} />
            {getBadge('orders') !== null && (
              <span className="absolute -top-1 -right-2 bg-red-600 text-white font-mono text-[8px] font-bold px-1 rounded-full">
                {getBadge('orders')}
              </span>
            )}
          </div>
          <span className="mt-0.5 truncate">Pesanan</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('inventory')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[9px] font-medium transition active:scale-95 cursor-pointer ${
            activeTab === 'inventory' ? 'text-black font-bold' : 'text-black/50 hover:text-black'
          }`}
        >
          <Icon name="inventory_2" size={17} />
          <span className="mt-0.5 truncate">Stok</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('catalog')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[9px] font-medium transition active:scale-95 cursor-pointer ${
            activeTab === 'catalog' ? 'text-black font-bold' : 'text-black/50 hover:text-black'
          }`}
        >
          <Icon name="checkroom" size={17} />
          <span className="mt-0.5 truncate">Katalog</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('section-home')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[9px] font-medium transition active:scale-95 cursor-pointer ${
            activeTab === 'section-home' ? 'text-black font-bold' : 'text-black/50 hover:text-black'
          }`}
        >
          <Icon name="view_quilt" size={17} />
          <span className="mt-0.5 truncate">Beranda</span>
        </button>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 text-[9px] font-medium text-black/50 hover:text-black transition active:scale-95 cursor-pointer"
        >
          <Icon name="menu" size={17} />
          <span className="mt-0.5 truncate">Menu</span>
        </button>
      </nav>
    </>
  );
}
