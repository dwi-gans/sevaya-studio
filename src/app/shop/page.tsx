'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ProductCard, Product } from '@/components/home/ProductCard';
import { DEFAULT_DB_PRODUCTS, ProductSwatch } from '@/integrations/supabase';
import { SEARCH_CATALOG } from '@/data/searchCatalog';
import { Icon } from '@/components/ui/Icon';
import { Footer } from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';

// Map search catalog to ProductCard props
const INITIAL_PRODUCTS: Product[] = SEARCH_CATALOG.map((p) => ({
  id: String(p.id),
  slug: p.slug,
  title: p.title,
  edition: p.edition,
  price: p.price,
  originalPrice: p.originalPrice,
  badge: p.badge,
  image: p.image,
  images: [p.image],
  swatches: [
    { name: 'Black', color: '#1A1A1A', image: p.image },
    { name: 'Mocha', color: '#B28E78', image: p.image },
    { name: 'Dusty Pink', color: '#DCAEAA', image: p.image },
  ],
}));

const CATEGORIES = [
  { id: 'all', label: 'All Collections' },
  { id: 'abaya', label: 'Abaya' },
  { id: 'khimar', label: 'Khimar & Veil' },
  { id: 'kaftan', label: 'Kaftan' },
  { id: 'sets', label: 'Modest Sets' },
  { id: 'bestseller', label: 'Best Sellers' },
];

function ShopContent() {
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const initialCategory = searchParams.get('category') || 'all';
  const initialQuery = searchParams.get('q') || searchParams.get('search') || '';

  const [activeCategory, setActiveCategory] = useState(initialCategory.toLowerCase());
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('search') || '';
    setSearchQuery(q);
    setSearchInput(q);
    const cat = searchParams.get('category') || 'all';
    setActiveCategory(cat.toLowerCase());
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchInput('');
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let list = [...INITIAL_PRODUCTS];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.edition?.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.badge && p.badge.toLowerCase().includes(q))
      );
    }

    if (activeCategory === 'abaya') {
      list = list.filter((p) => p.title.toLowerCase().includes('abaya') || p.slug.includes('abaya'));
    } else if (activeCategory === 'khimar') {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes('khimar') ||
          p.title.toLowerCase().includes('veil') ||
          p.slug.includes('khimar') ||
          p.title.toLowerCase().includes('fina'),
      );
    } else if (activeCategory === 'kaftan') {
      list = list.filter(
        (p) => p.title.toLowerCase().includes('kaftan') || p.slug.includes('kaftan'),
      );
    } else if (activeCategory === 'sets') {
      list = list.filter(
        (p) => p.title.toLowerCase().includes('set') || p.slug.includes('set') || p.slug.includes('stripe'),
      );
    } else if (activeCategory === 'bestseller') {
      list = list.filter((p) => Boolean(p.badge?.toLowerCase().includes('seller')) || p.price > 1300000);
    }

    // Sort
    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }, [activeCategory, sortBy, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Top Breadcrumb & Editorial Header */}
      <div className="border-b border-[#E5DDD5]/60 bg-[#FAF8F5]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-[#7C726E]">
            <Link href="/" className="hover:text-[#141312]">
              Home
            </Link>
            <span>/</span>
            <span className="font-medium text-[#141312]">Shop</span>
            {activeCategory !== 'all' && (
              <>
                <span>/</span>
                <span className="capitalize text-[#141312]">{activeCategory}</span>
              </>
            )}
          </nav>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-[10px] font-semibold tracking-[0.3em] text-[#8E8380] uppercase">
                THE SEVAYA CATALOGUE
              </span>
              <h1 className="mt-1 font-sans text-2xl font-medium tracking-wide text-[#141312] sm:text-3xl lg:text-4xl">
                {activeCategory === 'all'
                  ? 'All Collections'
                  : CATEGORIES.find((c) => c.id === activeCategory)?.label || 'Collections'}
              </h1>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-[#685E5A] sm:text-sm">
              Discover considered silhouettes, sustainable cupro drapes, and mindful modest wear crafted for lasting comfort.
            </p>
          </div>
        </div>
      </div>

      {/* Sticky Category Pills & Filter Bar (Taza Label style) */}
      <div className="sticky top-16 z-30 border-b border-[#E5DDD5]/80 bg-[#FAF8F5]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          {/* Horizontal Category Scroll */}
          <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium tracking-wider uppercase transition-all ${
                    isActive
                      ? 'bg-[#141312] text-[#FAF8F5] shadow-xs'
                      : 'border border-[#E5DDD5] bg-white text-[#554C48] hover:border-[#141312] hover:text-[#141312]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Right: Search Bar & Sort Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop Inline Search */}
            <form onSubmit={handleSearchSubmit} className="relative hidden md:flex items-center">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={language === 'id' ? 'Cari di katalog...' : 'Search catalogue...'}
                className="w-44 lg:w-56 rounded-full border border-[#E5DDD5] bg-white py-1.5 pl-8 pr-7 text-xs text-[#141312] placeholder:text-[#8E8380] focus:border-[#141312] focus:outline-none transition-all focus:w-64"
              />
              <Icon name="search" size={14} className="absolute left-2.5 text-[#8E8380] pointer-events-none" />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 text-[#8E8380] hover:text-[#141312]"
                >
                  <Icon name="close" size={12} />
                </button>
              )}
            </form>

            {/* Desktop Sort Dropdown */}
            <div className="hidden items-center gap-2 sm:flex">
              <label htmlFor="shop-sort" className="text-xs font-medium text-[#8E8380]">
                Sort:
              </label>
              <select
                id="shop-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="cursor-pointer rounded-md border border-[#E5DDD5] bg-white px-3 py-1.5 text-xs font-medium text-[#141312] focus:border-[#141312] focus:outline-none"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>

            {/* Mobile Filter Button */}
            <button
              type="button"
              onClick={() => setFilterDrawerOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-[#E5DDD5] bg-white px-3.5 py-1.5 text-xs font-medium text-[#141312] shadow-xs sm:hidden"
            >
              <Icon name="tune" size={15} />
              <span>Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Catalogue Grid Section */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Active Search Banner */}
        {searchQuery && (
          <div className="mb-6 flex items-center justify-between rounded-xl bg-[#F4EFEB] border border-[#E5DDD5] px-4 py-3 text-xs text-[#141312]">
            <div className="flex items-center gap-2">
              <Icon name="search" size={16} className="text-[#8E8380] shrink-0" />
              <span>
                {language === 'id' ? 'Hasil pencarian untuk:' : 'Search results for:'}{' '}
                <strong className="font-semibold text-[#141312]">&ldquo;{searchQuery}&rdquo;</strong>{' '}
                <span className="text-[#8E8380]">({filteredProducts.length} {language === 'id' ? 'produk' : 'pieces'})</span>
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearSearch}
              className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-medium text-[#141312] shadow-xs hover:bg-[#FAF8F5] transition"
            >
              <Icon name="close" size={12} />
              <span>{language === 'id' ? 'Hapus' : 'Clear'}</span>
            </button>
          </div>
        )}

        {/* Item Counter */}
        <div className="mb-6 flex items-center justify-between text-xs text-[#8E8380]">
          <span>Showing {filteredProducts.length} pieces</span>
          <div className="flex items-center gap-3">
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="underline underline-offset-2 hover:text-[#141312]"
              >
                Reset Search
              </button>
            )}
            {activeCategory !== 'all' && (
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className="underline underline-offset-2 hover:text-[#141312]"
              >
                Reset Category
              </button>
            )}
          </div>
        </div>

        {/* Responsive Grid: 2 cols on mobile (Taza Label style), 3 on tablet, 4 on desktop */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-8">
            {filteredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Icon name="search_off" size={40} className="text-[#8E8380]" />
            <h3 className="mt-4 font-sans text-base font-medium text-[#141312] sm:text-lg">
              No pieces found
            </h3>
            <p className="mt-1 text-xs text-[#685E5A]">
              Try choosing another category or clearing your filters.
            </p>
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className="mt-6 rounded-full bg-[#141312] px-5 py-2.5 text-xs font-semibold tracking-wider text-white uppercase transition hover:bg-[#322D29]"
            >
              View All Products
            </button>
          </div>
        )}
      </div>

      {/* Mobile Filter Drawer */}
      {filterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#1B1718]/60 backdrop-blur-xs"
            onClick={() => setFilterDrawerOpen(false)}
          />
          <div className="relative z-10 ml-auto flex h-full w-[85vw] max-w-sm flex-col bg-[#FAF8F5] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E5DDD5] pb-4">
              <h2 className="font-sans text-base font-medium tracking-wide text-[#141312]">Filter &amp; Sort</h2>
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setFilterDrawerOpen(false)}
                className="rounded-full p-2 text-[#685E5A] hover:bg-[#F4EFEB]"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto py-6">
              {/* Mobile Search */}
              <div>
                <h3 className="mb-2 text-xs font-semibold tracking-wider text-[#8E8380] uppercase">
                  {language === 'id' ? 'Cari Produk' : 'Search Pieces'}
                </h3>
                <form
                  onSubmit={(e) => {
                    handleSearchSubmit(e);
                    setFilterDrawerOpen(false);
                  }}
                  className="relative flex items-center"
                >
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder={language === 'id' ? 'Ketik nama abaya, bahan...' : 'Type name, fabric...'}
                    className="w-full rounded-xl border border-[#D0C5BD] bg-white py-2 pl-9 pr-8 text-xs text-[#141312] placeholder:text-[#8E8380] focus:border-[#141312] focus:outline-none"
                  />
                  <Icon name="search" size={16} className="absolute left-3 text-[#8E8380] pointer-events-none" />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-3 text-[#8E8380] hover:text-[#141312]"
                    >
                      <Icon name="close" size={14} />
                    </button>
                  )}
                </form>
              </div>

              {/* Category */}
              <div>
                <h3 className="mb-3 text-xs font-semibold tracking-wider text-[#8E8380] uppercase">
                  Category
                </h3>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setActiveCategory(cat.id);
                      }}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-medium uppercase transition-colors ${
                        activeCategory === cat.id
                          ? 'bg-[#141312] text-white'
                          : 'border border-[#E5DDD5] bg-white text-[#554C48]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div>
                <h3 className="mb-3 text-xs font-semibold tracking-wider text-[#8E8380] uppercase">
                  Sort By
                </h3>
                <div className="space-y-2">
                  {[
                    { id: 'featured', label: 'Featured Pieces' },
                    { id: 'price-asc', label: 'Price: Low to High' },
                    { id: 'price-desc', label: 'Price: High to Low' },
                    { id: 'name', label: 'Alphabetical' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSortBy(s.id as any)}
                      className={`flex w-full items-center justify-between rounded-none border p-3 text-left text-xs font-medium transition-colors ${
                        sortBy === s.id
                          ? 'border-[#141312] bg-[#FAF8F5] text-[#141312]'
                          : 'border-[#E5DDD5] bg-white text-[#685E5A]'
                      }`}
                    >
                      <span>{s.label}</span>
                      {sortBy === s.id && <Icon name="check" size={16} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-[#E5DDD5] pt-4">
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(false)}
                className="w-full rounded-full bg-[#141312] py-3 text-center text-xs font-semibold tracking-wider text-white uppercase transition hover:bg-[#322D29]"
              >
                Apply Filters ({filteredProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#141312] border-t-transparent" />
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
