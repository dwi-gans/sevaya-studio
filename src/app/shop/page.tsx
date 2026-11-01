'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ProductCard, Product } from '@/components/home/ProductCard';
import { getDbProducts, DEFAULT_DB_PRODUCTS, DbProduct } from '@/integrations/supabase';
import { mapDbProductToProduct } from '@/features/catalog';
import { Icon } from '@/components/ui/Icon';
import { Footer } from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';

const CATEGORIES = [
  { id: 'all', label: 'All Collections' },
  { id: 'abaya', label: 'Abaya' },
  { id: 'khimar', label: 'Khimar' },
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

  // Initial state strictly derives from DEFAULT_DB_PRODUCTS so there is zero hardcoded disparity
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(() =>
    DEFAULT_DB_PRODUCTS.filter((p) => !p.hidden).map(mapDbProductToProduct)
  );

  // Always fetch fresh products on mount and update catalogProducts
  useEffect(() => {
    let isMounted = true;
    async function loadFreshProducts() {
      try {
        const items = await getDbProducts();
        if (!isMounted) return;
        if (Array.isArray(items) && items.length > 0) {
          const visible = items.filter((p) => !p.hidden).map(mapDbProductToProduct);
          setCatalogProducts(visible);
        }
      } catch (e) {
        console.error('Failed to load shop products:', e);
      }
    }
    loadFreshProducts();
    return () => {
      isMounted = false;
    };
  }, []);

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
    let list = [...catalogProducts];

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
      list = list.filter(
        (p) =>
          p.category === 'abaya' ||
          p.title.toLowerCase().includes('abaya') ||
          p.slug.toLowerCase().includes('abaya')
      );
    } else if (activeCategory === 'khimar') {
      list = list.filter(
        (p) =>
          p.category === 'khimar' ||
          p.title.toLowerCase().includes('khimar') ||
          p.title.toLowerCase().includes('veil') ||
          p.slug.toLowerCase().includes('khimar')
      );
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
  }, [catalogProducts, activeCategory, sortBy, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      {/* Top Breadcrumb & Editorial Header */}
      <div className="border-b border-[#E5E5E5]/60 bg-[#FFFFFF]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[9px] tracking-widest text-[#666666] uppercase">
                <Link href="/" className="hover:text-[#000000] transition-colors">
                  Home
                </Link>
                <span>/</span>
                <span className="text-[#000000] font-medium">Collections</span>
              </div>
              <h1 className="font-headline text-2xl font-light tracking-tight text-[#000000] uppercase sm:text-3xl lg:text-4xl">
                Ready to Wear
              </h1>
              <p className="mt-1 text-[11px] text-[#666666] tracking-wide">
                Architectural modest silhouettes, pure fabrics, and refined craftsmanship.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Active Search Notification */}
        {searchQuery && (
          <div className="mb-6 flex items-center justify-between rounded-xl bg-[#F5F5F5] border border-[#E5E5E5] px-4 py-3 text-[10px] text-[#000000]">
            <div className="flex items-center gap-2">
              <Icon name="search" size={16} className="text-[#666666] shrink-0" />
              <span>
                {language === 'id' ? 'Hasil pencarian untuk:' : 'Search results for:'}{' '}
                <strong className="font-semibold text-[#000000]">&ldquo;{searchQuery}&rdquo;</strong>{' '}
                <span className="text-[#666666]">
                  ({filteredProducts.length} {language === 'id' ? 'produk' : 'pieces'})
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearSearch}
              className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-medium text-[#000000] shadow-xs hover:bg-[#FFFFFF] transition cursor-pointer"
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
                className="underline underline-offset-2 hover:text-[#000000] cursor-pointer"
              >
                Reset Search
              </button>
            )}
            {activeCategory !== 'all' && (
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className="underline underline-offset-2 hover:text-[#000000] cursor-pointer"
              >
                Reset Category
              </button>
            )}
          </div>
        </div>

        {/* Responsive Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-8">
            {filteredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#CCCCCC] p-8 text-center">
            <Icon name="search" size={32} className="text-[#999999] mb-3" />
            <h3 className="font-headline text-sm font-semibold tracking-wide text-[#000000] uppercase">
              No Pieces Found
            </h3>
            <p className="mt-1 max-w-xs text-[10px] text-[#666666]">
              {searchQuery
                ? `No results matching "${searchQuery}". Try searching with different keywords.`
                : 'No pieces currently available in this category.'}
            </p>
            <div className="mt-5 flex gap-2">
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="rounded-full bg-[#000000] px-4 py-2 text-[10px] font-semibold tracking-wider text-white uppercase hover:bg-[#333333] transition cursor-pointer"
                >
                  Clear Search
                </button>
              )}
              {activeCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  className="rounded-full border border-[#000000] bg-white px-4 py-2 text-[10px] font-semibold tracking-wider text-[#000000] uppercase hover:bg-[#F5F5F5] transition cursor-pointer"
                >
                  View All Products
                </button>
              )}
            </div>
          </div>
        )}
      </div>

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
