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
    <div className="min-h-screen bg-[#FFFFFF]">
      {/* Top Breadcrumb & Editorial Header */}
      <div className="border-b border-[#E5E5E5]/60 bg-[#FFFFFF]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-[10px] font-semibold tracking-[0.3em] text-[#666666] uppercase">
                THE SEVAYA CATALOGUE
              </span>
              <h1 className="mt-1 font-sans text-base font-medium tracking-wide text-[#000000] sm:text-xl lg:text-2xl">
                {activeCategory === 'all'
                  ? 'All Collections'
                  : CATEGORIES.find((c) => c.id === activeCategory)?.label || 'Collections'}
              </h1>
            </div>
            <p className="max-w-md text-[10px] leading-relaxed text-[#555555] sm:text-xs">
              Discover considered silhouettes, sustainable cupro drapes, and mindful modest wear crafted for lasting comfort.
            </p>
          </div>
        </div>
      </div>

      {/* Sticky Category Pills & Filter Bar (Taza Label style) */}
      <div className="sticky top-16 z-30 border-b border-[#E5E5E5]/80 bg-[#FFFFFF]/95 backdrop-blur-md">
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
                  className={`shrink-0 rounded-full px-4 py-1.5 text-[10px] font-medium tracking-wider uppercase transition-all ${
                    isActive
                      ? 'bg-[#000000] text-[#FFFFFF] shadow-xs'
                      : 'border border-[#E5E5E5] bg-white text-[#333333] hover:border-[#000000] hover:text-[#000000]'
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
                className="w-44 lg:w-56 rounded-full border border-[#E5E5E5] bg-white py-1.5 pl-8 pr-7 text-[10px] text-[#000000] placeholder:text-[#666666] focus:border-[#000000] focus:outline-none transition-all focus:w-64"
              />
              <Icon name="search" size={14} className="absolute left-2.5 text-[#666666] pointer-events-none" />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 text-[#666666] hover:text-[#000000]"
                >
                  <Icon name="close" size={12} />
                </button>
              )}
            </form>

            {/* Desktop Sort Dropdown */}
            <div className="hidden items-center gap-2 sm:flex">
              <label htmlFor="shop-sort" className="text-[10px] font-medium text-[#666666]">
                Sort:
              </label>
              <select
                id="shop-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="cursor-pointer rounded-md border border-[#E5E5E5] bg-white px-3 py-1.5 text-[10px] font-medium text-[#000000] focus:border-[#000000] focus:outline-none"
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
              className="flex items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-3.5 py-1.5 text-[10px] font-medium text-[#000000] shadow-xs sm:hidden"
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
          <div className="mb-6 flex items-center justify-between rounded-xl bg-[#F5F5F5] border border-[#E5E5E5] px-4 py-3 text-[10px] text-[#000000]">
            <div className="flex items-center gap-2">
              <Icon name="search" size={16} className="text-[#666666] shrink-0" />
              <span>
                {language === 'id' ? 'Hasil pencarian untuk:' : 'Search results for:'}{' '}
                <strong className="font-semibold text-[#000000]">&ldquo;{searchQuery}&rdquo;</strong>{' '}
                <span className="text-[#666666]">({filteredProducts.length} {language === 'id' ? 'produk' : 'pieces'})</span>
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearSearch}
              className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-medium text-[#000000] shadow-xs hover:bg-[#FFFFFF] transition"
            >
              <Icon name="close" size={12} />
              <span>{language === 'id' ? 'Hapus' : 'Clear'}</span>
            </button>
          </div>
        )}

        {/* Item Counter */}
        <div className="mb-6 flex items-center justify-between text-[10px] text-[#666666]">
          <span>Showing {filteredProducts.length} pieces</span>
          <div className="flex items-center gap-3">
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="underline underline-offset-2 hover:text-[#000000]"
              >
                Reset Search
              </button>
            )}
            {activeCategory !== 'all' && (
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className="underline underline-offset-2 hover:text-[#000000]"
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
            <Icon name="search_off" size={40} className="text-[#666666]" />
            <h3 className="mt-4 font-sans text-xs font-medium text-[#000000] sm:text-sm">
              No pieces found
            </h3>
            <p className="mt-1 text-[10px] text-[#555555]">
              Try choosing another category or clearing your filters.
            </p>
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className="mt-6 rounded-full bg-[#000000] px-5 py-2.5 text-[10px] font-semibold tracking-wider text-white uppercase transition hover:bg-[#322D29]"
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
            className="fixed inset-0 bg-[#000000]/60 backdrop-blur-xs"
            onClick={() => setFilterDrawerOpen(false)}
          />
          <div className="relative z-10 ml-auto flex h-full w-[85vw] max-w-sm flex-col bg-[#FFFFFF] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
              <h2 className="font-sans text-xs font-medium tracking-wide text-[#000000]">Filter &amp; Sort</h2>
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setFilterDrawerOpen(false)}
                className="rounded-full p-2 text-[#555555] hover:bg-[#F5F5F5]"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto py-6">
              {/* Mobile Search */}
              <div>
                <h3 className="mb-2 text-[10px] font-semibold tracking-wider text-[#666666] uppercase">
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
                    className="w-full rounded-xl border border-[#CCCCCC] bg-white py-2 pl-9 pr-8 text-[10px] text-[#000000] placeholder:text-[#666666] focus:border-[#000000] focus:outline-none"
                  />
                  <Icon name="search" size={16} className="absolute left-3 text-[#666666] pointer-events-none" />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-3 text-[#666666] hover:text-[#000000]"
                    >
                      <Icon name="close" size={14} />
                    </button>
                  )}
                </form>
              </div>

              {/* Category */}
              <div>
                <h3 className="mb-3 text-[10px] font-semibold tracking-wider text-[#666666] uppercase">
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
                      className={`rounded-full px-3.5 py-1.5 text-[10px] font-medium uppercase transition-colors ${
                        activeCategory === cat.id
                          ? 'bg-[#000000] text-white'
                          : 'border border-[#E5E5E5] bg-white text-[#333333]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div>
                <h3 className="mb-3 text-[10px] font-semibold tracking-wider text-[#666666] uppercase">
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
                      className={`flex w-full items-center justify-between rounded-none border p-3 text-left text-[10px] font-medium transition-colors ${
                        sortBy === s.id
                          ? 'border-[#000000] bg-[#FFFFFF] text-[#000000]'
                          : 'border-[#E5E5E5] bg-white text-[#555555]'
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
            <div className="border-t border-[#E5E5E5] pt-4">
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(false)}
                className="w-full rounded-full bg-[#000000] py-3 text-center text-[10px] font-semibold tracking-wider text-white uppercase transition hover:bg-[#322D29]"
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
        <div className="flex min-h-screen items-center justify-center bg-[#FFFFFF]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#000000] border-t-transparent" />
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
