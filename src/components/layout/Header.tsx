'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useDrawer } from '@/context/DrawerContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Logo } from '@/components/ui/Logo';
import { Icon } from '@/components/ui/Icon';
import { SEARCH_CATALOG } from '@/data/searchCatalog';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount } = useCart();
  const { openDrawer } = useDrawer();
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Close search overlay on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  // Live matching products
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const searchResults = trimmedQuery
    ? SEARCH_CATALOG.filter((item) => {
        return (
          item.title.toLowerCase().includes(trimmedQuery) ||
          item.edition.toLowerCase().includes(trimmedQuery) ||
          item.slug.toLowerCase().includes(trimmedQuery) ||
          (item.badge && item.badge.toLowerCase().includes(trimmedQuery))
        );
      })
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.trim();
    setSearchOpen(false);
    setSearchQuery('');
    router.push(`/shop?q=${encodeURIComponent(q)}`);
  };

  const handleSelectTerm = (term: string) => {
    setSearchOpen(false);
    setSearchQuery('');
    router.push(`/shop?q=${encodeURIComponent(term)}`);
  };

  const isAdminPage =
    typeof window !== 'undefined'
      ? window.location.pathname.startsWith('/admin')
      : pathname === '/admin' || pathname.startsWith('/admin');

  if (isAdminPage) {
    return null;
  }

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isBagPage = pathname === '/bag';
  const showLanguageToggle =
    pathname === '/' ||
    pathname === '/lookbook' ||
    pathname === '/conscious' ||
    pathname === '/bag';

  return (
    <>
      <header className="pt-safe fixed top-0 z-40 w-full border-b border-[#E5DDD5]/60 bg-[#FAF8F5]/95 shadow-[0_1px_8px_rgba(27,23,24,0.03)] backdrop-blur-xl">
        <div className="px-gutter-mobile relative mx-auto flex h-16 max-w-7xl items-center justify-between">
          {isAuthPage ? (
            /* Auth Page Variant: Back Button + Centered Logo + Close Button */
            <div className="flex w-full items-center justify-between">
              <button
                type="button"
                aria-label="Go back"
                onClick={() => router.back()}
                className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-[#1B1718] transition-colors hover:bg-[#F4EFEB] hover:text-[#141312]"
              >
                <Icon name="arrow_back" size={20} />
              </button>

              <Link href="/" className="flex items-center" aria-label="Sevaya Home">
                <Logo className="h-7 w-auto" />
              </Link>

              <Link
                href="/"
                aria-label="Close to Home"
                className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-[#685E5A] transition-colors hover:bg-[#F4EFEB] hover:text-[#1B1718]"
              >
                <Icon name="close" size={20} />
              </Link>
            </div>
          ) : isBagPage ? (
            /* Bag Page Variant: Back Button + Centered Logo (Replaces 'Tas Belanja' text) + Shop Button */
            <div className="flex w-full items-center justify-between">
              <Link
                href="/shop"
                aria-label="Kembali Belanja"
                className="flex items-center gap-1.5 rounded-full p-2 text-[#141312] transition-colors hover:bg-[#F4EFEB]"
              >
                <Icon name="arrow_back" size={20} />
                <span className="hidden sm:inline text-xs font-semibold tracking-wider uppercase">
                  {language === 'id' ? 'Kembali' : 'Back'}
                </span>
              </Link>

              {/* Centered Logo replacing any text */}
              <Link href="/" className="flex items-center" aria-label="Sevaya Home">
                <Logo className="h-7 w-auto sm:h-8" />
              </Link>

              <Link
                href="/shop"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DDD5] bg-[#FAF8F5] px-3.5 py-1.5 text-xs font-semibold tracking-wider text-[#141312] uppercase transition hover:border-[#141312] hover:bg-[#F4EFEB]"
              >
                <span className="hidden sm:inline">
                  {language === 'id' ? 'Lanjut Belanja' : 'Continue Shopping'}
                </span>
                <span className="sm:hidden">{language === 'id' ? 'Belanja' : 'Shop'}</span>
              </Link>
            </div>
          ) : (
            /* Standard Storefront Header */
            <>
              {/* Left: Drawer Trigger (Mobile) & Logo (Desktop) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Open Navigation Menu"
                  onClick={openDrawer}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-[#1B1718] transition-colors hover:bg-[#F4EFEB] hover:text-[#141312] md:hidden"
                >
                  <Icon name="menu" size={22} />
                </button>

                <Link
                  href="/"
                  className="hidden items-center pl-1 md:flex"
                  aria-label="Sevaya Homepage"
                >
                  <Logo className="h-7 w-auto sm:h-8" />
                </Link>
              </div>

              {/* Mobile Centered Logo */}
              <div className="pointer-events-none absolute inset-x-0 flex items-center justify-center md:hidden">
                <Link
                  href="/"
                  className="pointer-events-auto flex items-center"
                  aria-label="Sevaya Homepage"
                >
                  <Logo className="h-6 w-auto" />
                </Link>
              </div>

              {/* Center: Desktop Navigation Links */}
              <nav aria-label="Primary Navigation" className="hidden items-center gap-8 md:flex">
                {[
                  { key: 'nav.home', label: t('nav.home') || 'Home', href: '/' },
                  { key: 'nav.lookbook', label: t('nav.lookbook') || 'Lookbook', href: '/lookbook' },
                  { key: 'nav.shop', label: t('nav.shop') || 'Shop', href: '/shop' },
                  { key: 'nav.about', label: t('nav.about') || 'About', href: '/conscious' },
                  { key: 'nav.news', label: t('nav.news') || 'News', href: '/news' },
                ].map((item) => {
                  const isActive =
                    item.href === '/'
                      ? pathname === '/'
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative py-2 text-[14px] lg:text-[15px] tracking-wide transition-colors ${
                        isActive
                          ? 'font-medium text-[#141312]'
                          : 'text-[#685E5A] hover:text-[#141312]'
                      }`}
                    >
                      <span>{item.label}</span>
                      {/* Active Line Indicator & Interactive Hover Line */}
                      <span
                        className={`absolute bottom-0 left-0 h-[2px] w-full bg-[#141312] transition-all duration-300 origin-left ${
                          isActive
                            ? 'scale-x-100 opacity-100'
                            : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100'
                        }`}
                      />
                    </Link>
                  );
                })}
              </nav>

              {/* Right: Actions */}
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  aria-label="Search Catalog"
                  onClick={() => setSearchOpen(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-[#141312] transition-colors hover:bg-[#F4EFEB]"
                >
                  <Icon name="search" size={19} />
                </button>

                <Link
                  href={user ? '/profile' : '/login'}
                  aria-label={user ? 'Akun Saya' : 'Account Login'}
                  className="relative hidden h-10 w-10 items-center justify-center rounded-full text-[#141312] transition-colors hover:bg-[#F4EFEB] md:flex"
                  title={user ? `Akun Saya (${user.name})` : 'Masuk Akun'}
                >
                  <Icon name="person" size={19} />
                  {user && (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-600 ring-2 ring-white" />
                  )}
                </Link>

                <Link
                  href="/bag"
                  aria-label="Shopping Bag"
                  className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#141312] transition-colors hover:bg-[#F4EFEB]"
                >
                  <Icon name="shopping_bag" size={19} />
                  {itemCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#141312] px-[3px] text-[10px] leading-none font-semibold text-[#FAF8F5] shadow-xs">
                      {itemCount}
                    </span>
                  )}
                </Link>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Quick Search Overlay Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center bg-[#1B1718]/60 px-4 pt-16 sm:pt-20 backdrop-blur-sm transition-opacity"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#E5DDD5] bg-[#FAF8F5] shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 border-b border-[#E5DDD5] p-3.5 sm:p-4">
              <button type="submit" aria-label="Search" className="text-[#685E5A] hover:text-[#141312]">
                <Icon name="search" size={20} />
              </button>
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'id'
                    ? 'Cari abaya, bahan cupro, Floraison...'
                    : 'Search silhouettes, fabrics, Floraison, abayas...'
                }
                className="font-body-md text-sm sm:text-base flex-1 bg-transparent text-[#141312] placeholder:text-[#8E8380] focus:outline-none"
              />
              {searchQuery.trim().length > 0 && (
                <button
                  type="button"
                  aria-label="Clear query"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-[#8E8380] hover:text-[#141312]"
                >
                  <Icon name="close" size={16} />
                </button>
              )}
              <button
                type="button"
                aria-label="Close search"
                onClick={() => setSearchOpen(false)}
                className="rounded-full p-1 text-[#685E5A] hover:bg-[#F4EFEB] hover:text-[#141312]"
              >
                <Icon name="close" size={20} />
              </button>
            </form>

            {/* Live Search Results or Trending Searches */}
            {trimmedQuery ? (
              <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-[#8E8380]">
                  <span className="font-semibold tracking-wider uppercase">
                    {language === 'id' ? 'Hasil Produk' : 'Product Results'} ({searchResults.length})
                  </span>
                  {searchResults.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="font-medium text-[#141312] underline hover:text-[#685E5A]"
                    >
                      {language === 'id' ? 'Buka di Katalog →' : 'Open in Shop →'}
                    </button>
                  )}
                </div>

                {searchResults.length > 0 ? (
                  <div className="divide-y divide-[#E5DDD5]/60">
                    {searchResults.map((item) => (
                      <Link
                        key={item.id}
                        href={`/product/${item.slug}`}
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="group flex items-center gap-3.5 py-2.5 transition-colors hover:bg-white/60 rounded-xl px-2 -mx-2"
                      >
                        <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-[#F4EFEB] border border-[#E5DDD5]">
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                            sizes="48px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-medium text-[#141312] truncate group-hover:text-[#6b1d2f] transition-colors">
                              {item.title}
                            </h4>
                            {item.badge && (
                              <span className="rounded-full bg-[#141312] px-2 py-0.5 text-[9px] font-semibold tracking-wider text-[#FAF8F5] uppercase shrink-0">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#8E8380] truncate">{item.edition}</p>
                          <p className="text-xs font-semibold text-[#141312] mt-0.5">
                            Rp {item.price.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <Icon
                          name="chevron_right"
                          size={16}
                          className="text-[#8E8380] group-hover:translate-x-0.5 transition-transform"
                        />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Icon name="search_off" size={32} className="mx-auto text-[#8E8380] mb-2" />
                    <p className="text-sm font-medium text-[#141312]">
                      {language === 'id'
                        ? `Tidak ada produk yang cocok dengan "${searchQuery}"`
                        : `No pieces found matching "${searchQuery}"`}
                    </p>
                    <p className="text-xs text-[#8E8380] mt-1">
                      {language === 'id'
                        ? 'Coba gunakan kata kunci seperti Abaya, Cupro, Stripe, atau Rhapsody.'
                        : 'Try searching for Abaya, Cupro, Stripe, or Rhapsody.'}
                    </p>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="pt-2 border-t border-[#E5DDD5]">
                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="w-full rounded-xl bg-[#141312] py-2.5 text-xs font-semibold text-[#FAF8F5] transition hover:bg-[#2e2b29] text-center"
                    >
                      {language === 'id'
                        ? `Lihat Semua Hasil untuk "${searchQuery}"`
                        : `View All Results for "${searchQuery}"`}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#F4EFEB]/60 p-4 space-y-4">
                <div>
                  <p className="text-[11px] font-semibold tracking-wider text-[#8E8380] uppercase mb-2.5">
                    {language === 'id' ? 'Pencarian Populer' : 'Trending Searches'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Floraison',
                      'Fina Abaya Stripe',
                      'Tala Abaya Cloudmatte',
                      'Bemberg Cupro',
                      'Modest Abaya',
                    ].map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => handleSelectTerm(term)}
                        className="rounded-full border border-[#E5DDD5] bg-[#FAF8F5] px-3.5 py-1.5 text-xs font-medium text-[#141312] transition hover:border-[#141312] hover:bg-white"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold tracking-wider text-[#8E8380] uppercase mb-2">
                    {language === 'id' ? 'Jelajahi Kategori' : 'Explore Collections'}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {[
                      { label: 'Abaya', href: '/shop?category=abaya' },
                      { label: 'Khimar & Veil', href: '/shop?category=khimar' },
                      { label: 'Kaftan', href: '/shop?category=kaftan' },
                      { label: 'Modest Sets', href: '/shop?category=sets' },
                      { label: 'Best Sellers', href: '/shop?category=bestseller' },
                    ].map((cat) => (
                      <Link
                        key={cat.href}
                        href={cat.href}
                        onClick={() => setSearchOpen(false)}
                        className="rounded-lg bg-white/80 px-3 py-1.5 text-[#685E5A] border border-[#E5DDD5]/80 hover:text-[#141312] hover:border-[#141312] transition"
                      >
                        {cat.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
