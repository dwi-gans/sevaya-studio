'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDrawer } from '@/context/DrawerContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Logo } from '@/components/ui/Logo';
import { Icon } from '@/components/ui/Icon';

type SubmenuKey = 'collection' | 'lookbook' | 'conscious' | null;

export function NavigationDrawer() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, closeDrawer } = useDrawer();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [activeSubmenu, setActiveSubmenu] = useState<SubmenuKey>(null);
  const [drawerSearch, setDrawerSearch] = useState('');
  const isId = language === 'id';

  if (!isOpen) return null;

  const collectionItems = [
    {
      label: isId ? 'Lihat Semua' : 'All Collections',
      href: '/shop',
      tag: null,
    },
    {
      label: isId ? 'Terbaru' : 'New Arrivals',
      href: '/shop?category=bestseller',
      tag: isId ? 'BARU' : 'NEW',
    },
    {
      label: isId ? 'Abaya' : 'Abaya',
      href: '/shop?category=abaya',
      tag: null,
    },
    {
      label: isId ? 'Khimar & Veil' : 'Khimar & Veil',
      href: '/shop?category=khimar',
      tag: null,
    },
    {
      label: isId ? 'Kaftan' : 'Kaftan',
      href: '/shop?category=kaftan',
      tag: null,
    },
    {
      label: isId ? 'Sets Modest' : 'Modest Sets',
      href: '/shop?category=sets',
      tag: null,
    },
  ];

  const chapters = [
    {
      id: 'chapter-1',
      title: isId ? 'BAB 1 // PERMULAAN YANG LEMBUT' : 'BAB 1 // GENTLE BEGINNINGS',
      href: '/lookbook#chapter-1',
    },
    {
      id: 'chapter-2',
      title: isId ? 'BAB 2 // KEHENINGAN HARMONIS' : 'BAB 2 // HARMONIC STILLNESS',
      href: '/lookbook#chapter-2',
    },
    {
      id: 'chapter-3',
      title: isId ? 'BAB 3 // MEKAR PENUH KESADARAN' : 'BAB 3 // MINDFUL UNFOLDING',
      href: '/lookbook#chapter-3',
    },
  ];

  const consciousItems = [
    {
      label: isId ? 'Tekstil Kami' : 'Our Textiles',
      href: '/conscious#textiles',
    },
    {
      label: isId ? 'Empat Pilar Komitmen' : 'Four Pillars',
      href: '/conscious#pillars',
    },
  ];

  const handleClose = () => {
    setActiveSubmenu(null);
    closeDrawer();
  };

  const submenuLabel: Record<NonNullable<SubmenuKey>, string> = {
    collection: t('nav.collection'),
    lookbook: t('nav.lookbook'),
    conscious: t('nav.conscious'),
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1B1718]/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Drawer Canvas with luxury slide-in entrance */}
      <div className="no-scrollbar relative z-10 ml-0 flex h-full w-[85vw] max-w-sm flex-col bg-[#FAF8F5] shadow-2xl animate-drawer-slide-in">
        {/* Top Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#E5DDD5]/50 px-6">
          {activeSubmenu ? (
            <button
              type="button"
              onClick={() => setActiveSubmenu(null)}
              className="flex items-center gap-2 text-[12px] font-semibold tracking-widest text-[#1B1718] uppercase transition-colors hover:text-[#685E5A]"
            >
              <Icon name="arrow_back" size={16} />
              <span>{submenuLabel[activeSubmenu]}</span>
            </button>
          ) : (
            <div className="flex items-center">
              <Logo className="h-5 w-auto" />
            </div>
          )}

          <div className="flex items-center gap-2">
            {!activeSubmenu && (
              <div className="flex items-center rounded-full border border-[#E5DDD5] bg-[#F4EFEB] p-0.5 text-[11px] font-semibold tracking-wider">
                <button
                  type="button"
                  onClick={() => setLanguage('id')}
                  className={`rounded-full px-2.5 py-1 uppercase transition-all ${
                    language === 'id'
                      ? 'bg-[#141312] text-[#FAF8F5] shadow-xs'
                      : 'text-[#685E5A] hover:text-[#1B1718]'
                  }`}
                >
                  ID
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`rounded-full px-2.5 py-1 uppercase transition-all ${
                    language === 'en'
                      ? 'bg-[#141312] text-[#FAF8F5] shadow-xs'
                      : 'text-[#685E5A] hover:text-[#1B1718]'
                  }`}
                >
                  EN
                </button>
              </div>
            )}

            <button
              type="button"
              aria-label="Close menu"
              onClick={handleClose}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#685E5A] transition-colors hover:bg-[#F4EFEB] hover:text-[#141312]"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          {/* ── SUBMENU: COLLECTION ── */}
          {activeSubmenu === 'collection' && (
            <div className="flex flex-col gap-6">
              <Link
                href="/#collections"
                onClick={handleClose}
                className="animate-luxury-fade-up text-[11px] font-semibold tracking-widest text-[#877274] uppercase hover:text-[#141312]"
                style={{ animationDelay: '50ms' }}
              >
                {isId ? 'Lihat Semua Koleksi' : 'View All Collections'}
              </Link>
              <div className="flex flex-col gap-5 pt-1">
                {collectionItems.map((item, i) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={handleClose}
                    className="animate-luxury-fade-up flex items-center justify-between text-[13px] font-medium tracking-widest text-[#1B1718] uppercase transition-colors hover:text-[#877274]"
                    style={{ animationDelay: `${80 + i * 40}ms` }}
                  >
                    <span>{item.label}</span>
                    {item.tag && (
                      <span className="rounded-full bg-[#6b1d2f] px-2 py-0.5 text-[9px] font-bold tracking-widest text-[#FAF8F5]">
                        {item.tag}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── SUBMENU: LOOKBOOK ── */}
          {activeSubmenu === 'lookbook' && (
            <div className="flex flex-col gap-6">
              <Link
                href="/lookbook"
                onClick={handleClose}
                className="animate-luxury-fade-up text-[11px] font-semibold tracking-widest text-[#877274] uppercase hover:text-[#141312]"
                style={{ animationDelay: '50ms' }}
              >
                {isId ? 'Lihat Semua Bab' : 'View All Chapters'}
              </Link>
              <div className="flex flex-col gap-6 pt-2">
                {chapters.map((chapter, i) => (
                  <Link
                    key={chapter.id}
                    href={chapter.href}
                    onClick={handleClose}
                    className="animate-luxury-fade-up text-[13px] font-medium tracking-widest text-[#1B1718] uppercase transition-colors hover:text-[#877274]"
                    style={{ animationDelay: `${80 + i * 50}ms` }}
                  >
                    {chapter.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── SUBMENU: CONSCIOUS ── */}
          {activeSubmenu === 'conscious' && (
            <div className="flex flex-col gap-6">
              <Link
                href="/conscious"
                onClick={handleClose}
                className="animate-luxury-fade-up text-[11px] font-semibold tracking-widest text-[#877274] uppercase hover:text-[#141312]"
                style={{ animationDelay: '50ms' }}
              >
                {isId ? 'Lihat Halaman Lengkap' : 'View Full Page'}
              </Link>
              <div className="flex flex-col gap-5 pt-1">
                {consciousItems.map((item, i) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={handleClose}
                    className="animate-luxury-fade-up text-[13px] font-medium tracking-widest text-[#1B1718] uppercase transition-colors hover:text-[#877274]"
                    style={{ animationDelay: `${80 + i * 50}ms` }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── MENU UTAMA dengan Animasi Luxury Staggered Fade Up ── */}
          {activeSubmenu === null && (
            <nav aria-label="Main Navigation" className="flex flex-col gap-6">
              {/* Quick Search */}
              <div className="animate-luxury-fade-up -mt-2 mb-1" style={{ animationDelay: '30ms' }}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!drawerSearch.trim()) return;
                    const q = drawerSearch.trim();
                    setDrawerSearch('');
                    handleClose();
                    router.push(`/shop?q=${encodeURIComponent(q)}`);
                  }}
                  className="relative flex items-center"
                >
                  <input
                    type="text"
                    value={drawerSearch}
                    onChange={(e) => setDrawerSearch(e.target.value)}
                    placeholder={isId ? 'Cari abaya, bahan, koleksi...' : 'Search silhouettes, fabrics...'}
                    className="w-full rounded-full border border-[#E5DDD5] bg-white py-2 pl-9 pr-8 text-xs text-[#141312] placeholder:text-[#8E8380] focus:border-[#141312] focus:outline-none"
                  />
                  <Icon name="search" size={16} className="absolute left-3 text-[#8E8380]" />
                  {drawerSearch && (
                    <button
                      type="button"
                      onClick={() => setDrawerSearch('')}
                      className="absolute right-3 text-[#8E8380] hover:text-[#141312]"
                    >
                      <Icon name="close" size={14} />
                    </button>
                  )}
                </form>
              </div>

              {/* 1. Beranda / Home */}
              <div className="animate-luxury-fade-up" style={{ animationDelay: '70ms' }}>
                <Link
                  href="/"
                  onClick={handleClose}
                  className={`group relative inline-flex w-fit items-center text-[13px] tracking-widest uppercase transition-colors ${
                    pathname === '/'
                      ? 'font-semibold text-[#141312]'
                      : 'font-medium text-[#1B1718] hover:text-[#877274]'
                  }`}
                >
                  <span>{isId ? 'Beranda' : 'Home'}</span>
                  <span
                    className={`absolute -bottom-1 left-0 h-[2px] w-full bg-[#141312] transition-all duration-300 origin-left ${
                      pathname === '/'
                        ? 'scale-x-100 opacity-100'
                        : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100'
                    }`}
                  />
                </Link>
              </div>

              {/* 2. Koleksi / Shop */}
              <div
                className="animate-luxury-fade-up flex items-center justify-between"
                style={{ animationDelay: '130ms' }}
              >
                <Link
                  href="/shop"
                  onClick={handleClose}
                  className={`group relative inline-flex w-fit items-center text-[13px] tracking-widest uppercase transition-colors ${
                    pathname.startsWith('/shop')
                      ? 'font-semibold text-[#141312]'
                      : 'font-medium text-[#1B1718] hover:text-[#877274]'
                  }`}
                >
                  <span>{isId ? 'Koleksi (Shop)' : 'Shop Collections'}</span>
                  <span
                    className={`absolute -bottom-1 left-0 h-[2px] w-full bg-[#141312] transition-all duration-300 origin-left ${
                      pathname.startsWith('/shop')
                        ? 'scale-x-100 opacity-100'
                        : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100'
                    }`}
                  />
                </Link>
                <button
                  type="button"
                  aria-label="Expand Shop categories"
                  onClick={() => setActiveSubmenu('collection')}
                  className="p-1 text-[#877274] hover:text-[#141312]"
                >
                  <Icon name="arrow_forward" size={16} />
                </button>
              </div>

              {/* 3. Lookbook */}
              <div className="animate-luxury-fade-up" style={{ animationDelay: '190ms' }}>
                <Link
                  href="/lookbook"
                  onClick={handleClose}
                  className={`group relative inline-flex w-fit items-center text-[13px] tracking-widest uppercase transition-colors ${
                    pathname.startsWith('/lookbook')
                      ? 'font-semibold text-[#141312]'
                      : 'font-medium text-[#1B1718] hover:text-[#877274]'
                  }`}
                >
                  <span>Lookbook</span>
                  <span
                    className={`absolute -bottom-1 left-0 h-[2px] w-full bg-[#141312] transition-all duration-300 origin-left ${
                      pathname.startsWith('/lookbook')
                        ? 'scale-x-100 opacity-100'
                        : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100'
                    }`}
                  />
                </Link>
              </div>

              {/* 4. Tentang / About */}
              <div className="animate-luxury-fade-up" style={{ animationDelay: '250ms' }}>
                <Link
                  href="/conscious"
                  onClick={handleClose}
                  className={`group relative inline-flex w-fit items-center text-[13px] tracking-widest uppercase transition-colors ${
                    pathname.startsWith('/conscious')
                      ? 'font-semibold text-[#141312]'
                      : 'font-medium text-[#1B1718] hover:text-[#877274]'
                  }`}
                >
                  <span>{isId ? 'Tentang (About)' : 'About SEVAYA'}</span>
                  <span
                    className={`absolute -bottom-1 left-0 h-[2px] w-full bg-[#141312] transition-all duration-300 origin-left ${
                      pathname.startsWith('/conscious')
                        ? 'scale-x-100 opacity-100'
                        : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100'
                    }`}
                  />
                </Link>
              </div>

              {/* 5. Warta & Editorial / News */}
              <div className="animate-luxury-fade-up" style={{ animationDelay: '310ms' }}>
                <Link
                  href="/news"
                  onClick={handleClose}
                  className={`group relative inline-flex w-fit items-center text-[13px] tracking-widest uppercase transition-colors ${
                    pathname.startsWith('/news')
                      ? 'font-semibold text-[#141312]'
                      : 'font-medium text-[#1B1718] hover:text-[#877274]'
                  }`}
                >
                  <span>{isId ? 'Warta & Editorial (News)' : 'News & Journals'}</span>
                  <span
                    className={`absolute -bottom-1 left-0 h-[2px] w-full bg-[#141312] transition-all duration-300 origin-left ${
                      pathname.startsWith('/news')
                        ? 'scale-x-100 opacity-100'
                        : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100'
                    }`}
                  />
                </Link>
              </div>
            </nav>
          )}
        </div>

        {/* ── Footer: Profile / Masuk Button (Menggantikan WhatsApp Concierge) ── */}
        <div
          className="pb-safe animate-luxury-fade-up border-t border-[#E5DDD5]/70 bg-white/60 px-6 py-4"
          style={{ animationDelay: '370ms' }}
        >
          {user ? (
            <div className="flex items-center justify-between">
              <Link
                href="/profile"
                onClick={handleClose}
                className="group flex items-center gap-3 text-left"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5DDD5] bg-[#FAF8F5] text-[#141312] transition-colors group-hover:bg-[#141312] group-hover:text-white">
                  <Icon name="person" size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-semibold tracking-wider text-[#141312] uppercase">
                    {isId ? 'Akun Saya' : 'My Account'}
                  </span>
                  <span className="text-[10px] text-[#8E8380] line-clamp-1">
                    {user.email || 'Member Sevaya'}
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  handleClose();
                }}
                className="rounded-none border border-[#E5DDD5] px-2.5 py-1 text-[11px] font-medium tracking-wider text-[#685E5A] uppercase transition-colors hover:border-[#141312] hover:text-[#141312]"
              >
                {isId ? 'Keluar' : 'Logout'}
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={handleClose}
              className="group flex items-center justify-between rounded-xl border border-[#E5DDD5] bg-white px-3.5 py-2.5 shadow-xs transition-all hover:border-[#141312] hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5DDD5] bg-[#FAF8F5] text-[#141312] transition-colors group-hover:bg-[#141312] group-hover:text-white">
                  <Icon name="person" size={16} />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[12px] font-semibold tracking-wider text-[#141312] uppercase">
                    {isId ? 'Masuk / Daftar' : 'Sign In / Register'}
                  </span>
                  <span className="text-[10px] text-[#8E8380]">
                    {isId ? 'Akses pesanan & status' : 'Access orders & status'}
                  </span>
                </div>
              </div>
              <Icon
                name="chevron_right"
                size={16}
                className="text-[#8E8380] transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
