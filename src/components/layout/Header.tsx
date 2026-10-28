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
import { LOOKBOOK_LINKS } from '@/data/lookbookNav';

const CUSTOMER_LINKS = [
  { label: 'Terms of Service', href: '/customer/terms-of-service' },
  { label: 'Shipping Information', href: '/customer/shipping-information' },
  { label: 'Returns & Exchanges', href: '/customer/returns-exchanges' },
  { label: 'FAQ', href: '/customer/faq' },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount } = useCart();
  const { openDrawer } = useDrawer();
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerOpen, setCustomerOpen] = useState(false);
  const [lookbookOpen, setLookbookOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isBagPage = pathname === '/bag';

  return (
    <>
      <header className="pt-safe fixed top-0 z-40 w-full border-b border-black/10 bg-white/95 text-black shadow-sm backdrop-blur-xl">
        <div className="relative mx-auto flex h-16 w-full items-center justify-between px-3 sm:px-6 lg:px-8">
          {isAuthPage ? (
            /* Auth Page Variant: Back Button + Centered Logo + Close Button */
            <div className="flex w-full items-center justify-between">
              <button
                type="button"
                aria-label="Go back"
                onClick={() => router.back()}
                className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-black transition-colors hover:bg-black/8"
              >
                <Icon name="arrow_back" size={20} />
              </button>

              <Link href="/" className="flex items-center" aria-label="Sevaya Home">
                <Logo className="h-7 w-auto text-black" />
              </Link>

              <Link
                href="/"
                aria-label="Close to Home"
                className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-black/60 transition-colors hover:bg-black/8 hover:text-black"
              >
                <Icon name="close" size={20} />
              </Link>
            </div>
          ) : isBagPage ? (
            /* Bag Page Variant: Back Button + Centered Logo */
            <div className="flex w-full items-center justify-between">
              <Link
                href="/shop"
                aria-label="Kembali Belanja"
                className="flex items-center gap-1.5 rounded-full p-2 text-black transition-colors hover:bg-black/8"
              >
                <Icon name="arrow_back" size={20} />
                <span className="hidden sm:inline text-xs font-semibold tracking-wider uppercase">
                  {language === 'id' ? 'Kembali' : 'Back'}
                </span>
              </Link>

              {/* Centered Logo */}
              <Link href="/" className="flex items-center" aria-label="Sevaya Home">
                <Logo className="h-7 w-auto sm:h-8 text-black" />
              </Link>

              {/* Spacer balance to keep logo centered */}
              <div className="w-10 sm:w-20" aria-hidden="true" />
            </div>
          ) : (
            /* Standard Storefront Header */
            <>
              {/* Left: Drawer Trigger (Mobile) & Logo (Desktop) — hugged to left */}
              <div className="flex items-center gap-2 -ml-1">
                <button
                  type="button"
                  aria-label="Open Navigation Menu"
                  onClick={openDrawer}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-black transition-colors hover:bg-black/8 md:hidden"
                >
                  <Icon name="menu" size={20} />
                </button>

                <Link
                  href="/"
                  className="hidden items-center md:flex"
                  aria-label="Sevaya Homepage"
                >
                  <Logo className="h-6 w-auto sm:h-7 text-black" />
                </Link>
              </div>

              {/* Mobile Centered Logo */}
              <div className="pointer-events-none absolute inset-x-0 flex items-center justify-center md:hidden">
                <Link
                  href="/"
                  className="pointer-events-auto flex items-center"
                  aria-label="Sevaya Homepage"
                >
                  <Logo className="h-6 w-auto text-black" />
                </Link>
              </div>

              {/* Center: Desktop Navigation Links */}
              <nav aria-label="Primary Navigation" className="absolute left-1/2 -translate-x-1/2 hidden items-center gap-7 lg:gap-8 md:flex">
                {/* 1. Home Link */}
                <Link
                  href="/"
                  className={`group relative py-2 text-[11px] tracking-wide transition-colors ${
                    pathname === "/"
                      ? "font-medium text-black"
                      : "text-black/60 hover:text-black"
                  }`}
                >
                  <span>{t("nav.home") || "Home"}</span>
                  <span
                    className={`absolute bottom-0 left-0 h-[2px] w-full bg-black transition-all duration-300 origin-left ${
                      pathname === "/"
                        ? "scale-x-100 opacity-100"
                        : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100"
                    }`}
                  />
                </Link>

                {/* 2. Lookbook Dropdown (hover popup) */}
                <div
                  className="relative"
                  onMouseEnter={() => setLookbookOpen(true)}
                  onMouseLeave={() => setLookbookOpen(false)}
                >
                  <Link
                    href="/lookbook"
                    className={`group relative py-2 text-[11px] tracking-wide transition-colors ${
                      pathname.startsWith("/lookbook")
                        ? "font-medium text-black"
                        : "text-black/60 hover:text-black"
                    }`}
                  >
                    <span>{t("nav.lookbook") || "Lookbook"}</span>
                    <span
                      className={`absolute bottom-0 left-0 h-[2px] w-full bg-black transition-all duration-300 origin-left ${
                        pathname.startsWith("/lookbook")
                          ? "scale-x-100 opacity-100"
                          : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100"
                      }`}
                    />
                  </Link>

                  {lookbookOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 z-50 pt-px">
                      <div className="border border-black/8 bg-white shadow-lg min-w-[220px] py-2">
                        {LOOKBOOK_LINKS.map((link) => (
                          <Link
                            key={link.id || link.href}
                            href={link.href}
                            onClick={() => setLookbookOpen(false)}
                            className={`flex items-center justify-between gap-3 px-5 py-2.5 text-[11px] tracking-wide transition-colors hover:bg-black/[0.04] hover:text-black ${
                              pathname === link.href ? "font-medium text-black" : "text-[#555555]"
                            }`}
                          >
                            <span className="truncate">{link.label}</span>
                            {link.season && (
                              <span className="shrink-0 font-mono text-[9px] text-black/40">
                                {link.season}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Shop, About, News */}
                {[
                  { key: "nav.shop", label: t("nav.shop") || "Shop", href: "/shop" },
                  { key: "nav.about", label: t("nav.about") || "About", href: "/conscious" },
                  { key: "nav.news", label: t("nav.news") || "News", href: "/news" },
                ].map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative py-2 text-[11px] tracking-wide transition-colors ${
                        isActive
                          ? "font-medium text-black"
                          : "text-black/60 hover:text-black"
                      }`}
                    >
                      <span>{item.label}</span>
                      <span
                        className={`absolute bottom-0 left-0 h-[2px] w-full bg-black transition-all duration-300 origin-left ${
                          isActive
                            ? "scale-x-100 opacity-100"
                            : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100"
                        }`}
                      />
                    </Link>
                  );
                })}

                {/* 4. Customer Dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => setCustomerOpen(true)}
                  onMouseLeave={() => setCustomerOpen(false)}
                >
                  <button
                    type="button"
                    className={`group relative py-2 text-[11px] tracking-wide transition-colors ${
                      pathname.startsWith("/customer")
                        ? "font-medium text-black"
                        : "text-black/60 hover:text-black"
                    }`}
                  >
                    <span>Help</span>
                    <span
                      className={`absolute bottom-0 left-0 h-[2px] w-full bg-black transition-all duration-300 origin-left ${
                        pathname.startsWith("/customer")
                          ? "scale-x-100 opacity-100"
                          : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100"
                      }`}
                    />
                  </button>

                  {customerOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 z-50 pt-px">
                      <div className="border border-black/8 bg-white shadow-lg min-w-[196px] py-2">
                        {CUSTOMER_LINKS.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setCustomerOpen(false)}
                            className={`block px-5 py-2.5 text-[11px] tracking-wide transition-colors hover:bg-black/[0.04] hover:text-black ${
                              pathname === link.href ? "font-medium text-black" : "text-[#555555]"
                            }`}
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </nav>

              {/* Right: Actions — smaller refined icons hugged to right */}
              <div className="flex items-center gap-0.5 sm:gap-1.5 -mr-1">
                <button
                  type="button"
                  aria-label="Search Catalog"
                  onClick={() => setSearchOpen(true)}
                  className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-full text-black transition-colors hover:bg-black/8"
                  title="Search"
                >
                  <Icon name="search" size={17} />
                </button>

                <Link
                  href={user ? '/profile' : '/login'}
                  aria-label={user ? 'Akun Saya' : 'Account Login'}
                  className="relative hidden h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-full text-black transition-colors hover:bg-black/8 md:flex"
                  title={user ? `Akun Saya (${user.name})` : 'Masuk Akun'}
                >
                  <Icon name="person" size={17} />
                  {user && (
                    <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-black ring-2 ring-white" />
                  )}
                </Link>

                <Link
                  href="/bag"
                  aria-label="Shopping Bag"
                  className="relative flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-full text-black transition-colors hover:bg-black/8"
                  title="Shopping Bag"
                >
                  <Icon name="shopping_bag" size={17} />
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-black px-[3px] text-[9px] leading-none font-bold text-white shadow-xs">
                      {itemCount}
                    </span>
                  )}
                </Link>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Quick Search Overlay Modal (Monochrome) */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center bg-black/80 px-4 pt-16 sm:pt-20 backdrop-blur-sm transition-opacity"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-xl overflow-hidden border border-white/20 bg-black text-white shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 border-b border-white/15 p-3.5 sm:p-4">
              <button type="submit" aria-label="Search" className="text-white/70 hover:text-white">
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
                className="font-body-md text-sm sm:text-base flex-1 bg-transparent text-white placeholder:text-white/40 focus:outline-none"
              />
              {searchQuery.trim().length > 0 && (
                <button
                  type="button"
                  aria-label="Clear query"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-white/50 hover:text-white"
                >
                  <Icon name="close" size={16} />
                </button>
              )}
              <button
                type="button"
                aria-label="Close search"
                onClick={() => setSearchOpen(false)}
                className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <Icon name="close" size={20} />
              </button>
            </form>

            {/* Live Search Results or Trending Searches */}
            {trimmedQuery ? (
              <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span className="font-semibold tracking-wider uppercase">
                    {language === 'id' ? 'Hasil Produk' : 'Product Results'} ({searchResults.length})
                  </span>
                  {searchResults.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="font-medium text-white underline hover:text-white/70"
                    >
                      {language === 'id' ? 'Buka di Katalog →' : 'Open in Shop →'}
                    </button>
                  )}
                </div>

                {searchResults.length > 0 ? (
                  <div className="divide-y divide-white/10">
                    {searchResults.map((item) => (
                      <Link
                        key={item.id}
                        href={`/product/${item.slug}`}
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="group flex items-center gap-3.5 py-2.5 transition-colors hover:bg-white/5 px-2 -mx-2"
                      >
                        <div className="relative h-14 w-12 shrink-0 overflow-hidden bg-white/10 border border-white/20">
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
                            <h4 className="text-xs sm:text-sm font-medium text-white truncate group-hover:text-white/80 transition-colors">
                              {item.title}
                            </h4>
                            {item.badge && (
                              <span className="border border-white/30 bg-white text-black px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase shrink-0">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-white/60 truncate">{item.edition}</p>
                          <p className="text-xs font-semibold text-white mt-0.5">
                            Rp {item.price.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <Icon
                          name="chevron_right"
                          size={16}
                          className="text-white/50 group-hover:translate-x-0.5 transition-transform"
                        />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Icon name="search_off" size={32} className="mx-auto text-white/50 mb-2" />
                    <p className="text-sm font-medium text-white">
                      {language === 'id'
                        ? `Tidak ada produk yang cocok dengan "${searchQuery}"`
                        : `No pieces found matching "${searchQuery}"`}
                    </p>
                    <p className="text-xs text-white/60 mt-1">
                      {language === 'id'
                        ? 'Coba gunakan kata kunci seperti Abaya, Cupro, Stripe, atau Rhapsody.'
                        : 'Try searching for Abaya, Cupro, Stripe, or Rhapsody.'}
                    </p>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="pt-2 border-t border-white/15">
                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="w-full bg-white py-2.5 text-xs font-semibold text-black uppercase tracking-wider transition hover:bg-white/90 text-center"
                    >
                      {language === 'id'
                        ? `Lihat Semua Hasil untuk "${searchQuery}"`
                        : `View All Results for "${searchQuery}"`}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/5 p-4 space-y-4">
                <div>
                  <p className="text-[11px] font-semibold tracking-wider text-white/60 uppercase mb-2.5">
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
                        className="border border-white/20 bg-black px-3.5 py-1.5 text-xs font-medium text-white transition hover:border-white hover:bg-white hover:text-black"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold tracking-wider text-white/60 uppercase mb-2">
                    {language === 'id' ? 'Jelajahi Kategori' : 'Explore Collections'}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {[
                      { label: language === 'id' ? 'Semua Koleksi' : 'All Collections', href: '/shop' },
                      { label: 'Abaya', href: '/shop?category=abaya' },
                      { label: 'Khimar', href: '/shop?category=khimar' },
                    ].map((cat) => (
                      <Link
                        key={cat.href}
                        href={cat.href}
                        onClick={() => setSearchOpen(false)}
                        className="bg-black px-3 py-1.5 text-white/70 border border-white/20 hover:text-white hover:border-white transition"
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
