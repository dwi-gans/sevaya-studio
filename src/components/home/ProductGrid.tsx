'use client';

import React, { useRef } from 'react';
import { ProductCard, Product } from './ProductCard';
import { Icon } from '@/components/ui/Icon';
import { useLanguage } from '@/context/LanguageContext';

export const DEFAULT_BEST_SELLERS: Product[] = [
  {
    id: '1',
    slug: 'fina-abaya-stripe-2',
    title: 'FINA ABAYA - STRIPE EDITION 2.0',
    edition: 'Edition 1.0',
    price: 499000,
    originalPrice: 599000,
    badge: 'BEST SELLER',
    image: '/images/catalog/catalog-01.jpg',
    images: ['/images/catalog/catalog-01.jpg', '/images/catalog/catalog-02.jpg'],
    swatches: [
      { name: 'Dusty Pink', color: '#DCAEAA' },
      { name: 'Mocha', color: '#B28E78' },
      { name: 'Black', color: '#1A1A1A' },
      { name: 'Soft Rose', color: '#EBB4B0' },
    ],
  },
  {
    id: '2',
    slug: 'fina-abaya-1',
    title: 'TALA ABAYA - RHAPSODY',
    edition: 'Edition 1.0',
    price: 499000,
    badge: 'NEW',
    image: '/images/catalog/catalog-03.jpg',
    images: ['/images/catalog/catalog-03.jpg', '/images/catalog/catalog-04.jpg'],
    swatches: [
      { name: 'Dusty Pink', color: '#DCAEAA' },
      { name: 'Mocha', color: '#B28E78' },
      { name: 'Black', color: '#1A1A1A' },
      { name: 'Soft Rose', color: '#EBB4B0' },
    ],
  },
  {
    id: '3',
    slug: 'tala-abaya-cloudmatte',
    title: 'SEVILLA CUPRO - ABAYA',
    edition: 'Edition 1.0',
    price: 499000,
    image: '/images/catalog/catalog-18.jpg',
    images: ['/images/catalog/catalog-18.jpg', '/images/catalog/catalog-17.jpg'],
    swatches: [
      { name: 'Dusty Pink', color: '#DCAEAA' },
      { name: 'Mocha', color: '#B28E78' },
      { name: 'Black', color: '#1A1A1A' },
      { name: 'Soft Rose', color: '#EBB4B0' },
    ],
  },
  {
    id: '4',
    slug: 'fina-abaya-stripe-oatmeal',
    title: 'FINA ABAYA - OATMEAL STRIPE',
    edition: 'Edition 1.0',
    price: 499000,
    image: '/images/catalog/catalog-13.jpg',
    images: ['/images/catalog/catalog-13.jpg', '/images/catalog/catalog-14.jpg'],
    swatches: [
      { name: 'Dusty Pink', color: '#DCAEAA' },
      { name: 'Mocha', color: '#B28E78' },
      { name: 'Black', color: '#1A1A1A' },
      { name: 'Soft Rose', color: '#EBB4B0' },
    ],
  },
  {
    id: '5',
    slug: 'fina-abaya-stripe-2',
    title: 'AMANI MODEST ABAYA - SAGE',
    edition: 'Edition 1.0',
    price: 499000,
    image: '/images/catalog/catalog-05.jpg',
    images: ['/images/catalog/catalog-05.jpg', '/images/catalog/catalog-06.jpg'],
    swatches: [
      { name: 'Sage Green', color: '#889A84' },
      { name: 'Black', color: '#1A1A1A' },
      { name: 'Rose', color: '#DBA8A0' },
    ],
  },
  {
    id: '6',
    slug: 'tala-abaya-cloudmatte',
    title: 'TALA ABAYA - CLOUDMATTE',
    edition: 'Edition 1.0',
    price: 499000,
    image: '/images/catalog/catalog-07.jpg',
    images: ['/images/catalog/catalog-07.jpg', '/images/catalog/catalog-08.jpg'],
    swatches: [
      { name: 'Beige', color: '#D2BFA6' },
      { name: 'Black', color: '#1A1A1A' },
      { name: 'Mocha', color: '#B28E78' },
    ],
  },
  {
    id: '7',
    slug: 'fina-abaya-1',
    title: 'LUNA ESSENTIAL ABAYA',
    edition: 'Edition 1.0',
    price: 499000,
    image: '/images/catalog/catalog-10.jpg',
    images: ['/images/catalog/catalog-10.jpg', '/images/catalog/catalog-09.jpg'],
    swatches: [
      { name: 'Grey', color: '#4A4E53' },
      { name: 'Black', color: '#1A1A1A' },
      { name: 'Cream', color: '#E5D6C5' },
    ],
  },
  {
    id: '8',
    slug: 'fina-abaya-stripe-oatmeal',
    title: 'NOUR LUXURY SILHOUETTE',
    edition: 'Edition 1.0',
    price: 499000,
    image: '/images/catalog/catalog-15.jpg',
    images: ['/images/catalog/catalog-15.jpg', '/images/catalog/catalog-16.jpg'],
    swatches: [
      { name: 'Espresso', color: '#3A271E' },
      { name: 'Black', color: '#1A1A1A' },
      { name: 'Camel', color: '#A98263' },
    ],
  },
];

interface ProductGridProps {
  products?: Product[];
}

export function ProductGrid({ products = DEFAULT_BEST_SELLERS }: ProductGridProps) {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isDown, setIsDown] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [scrollLeftPos, setScrollLeftPos] = React.useState(0);
  const [hasMoved, setHasMoved] = React.useState(false);

  const list = products && products.length > 0 ? products : DEFAULT_BEST_SELLERS;
  const displayList = list.length >= 8 ? list.slice(0, 8) : list;

  const scrollLeft = () => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.firstElementChild?.clientWidth || 300;
      scrollRef.current.scrollBy({ left: -(cardWidth * 2), behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.firstElementChild?.clientWidth || 300;
      scrollRef.current.scrollBy({ left: cardWidth * 2, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const centerPoint = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let minDistance = Infinity;
    Array.from(container.children).forEach((child, idx) => {
      const el = child as HTMLElement;
      const childCenter = el.offsetLeft + el.offsetWidth / 2;
      const dist = Math.abs(childCenter - centerPoint);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = idx;
      }
    });
    setActiveIndex((prev) => (prev !== closestIndex ? closestIndex : prev));
  };

  // Mouse drag-to-scroll handlers (butter-smooth with zero stutter)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDown(true);
    setHasMoved(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftPos(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown || !scrollRef.current) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.4;
    if (Math.abs(walk) > 3) {
      setHasMoved(true);
    }
    scrollRef.current.scrollLeft = scrollLeftPos - walk;
  };

  const handleMouseUp = () => {
    setIsDown(false);
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasMoved) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8" id="collections">
      {/* Top Header */}
      <div className="mb-6 flex flex-col gap-1 text-center sm:text-left">
        <span className="text-[11px] font-medium tracking-[0.2em] text-[#7C726E] uppercase">
          {t('grid.tag') || 'SHOP THE COLLECTION'}
        </span>
        <h2 className="font-sans text-xl font-medium tracking-wider text-[#141312] uppercase sm:text-2xl">
          {t('grid.title') || 'BEST-LOVED COLLECTIONS'}
        </h2>
      </div>

      {/* Relative container with arrows & horizontal scroll */}
      <div className="group relative">
        {/* Left Arrow (Desktop & Tablet) */}
        <button
          type="button"
          aria-label="Scroll left"
          onClick={scrollLeft}
          className="absolute -left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#D0C5BD] bg-white text-[#141312] shadow-md transition-all hover:scale-105 hover:bg-[#FAF8F5] sm:flex"
        >
          <Icon name="chevron_left" size={20} />
        </button>

        {/* Product Cards Row: centered on mobile with equal peeks, smooth snap */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClickCapture={handleClickCapture}
          className={`no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-[10vw] pb-4 touch-pan-y select-none sm:-mx-6 sm:gap-6 sm:px-6 md:mx-0 md:px-0 ${
            isDown ? 'cursor-grabbing scroll-auto' : 'cursor-grab scroll-smooth'
          }`}
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            scrollSnapType: isDown ? 'none' : 'x mandatory',
          }}
        >
          {displayList.map((p, i) => (
            <div
              key={`${p.id || 'prod'}-${p.slug || ''}-${i}`}
              className="w-[58vw] shrink-0 sm:w-[46vw] md:w-[285px] lg:w-[calc(25%-18px)] snap-center md:snap-start"
              style={{ scrollSnapAlign: 'center' }}
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>

        {/* Right Arrow (Desktop & Tablet) */}
        <button
          type="button"
          aria-label="Scroll right"
          onClick={scrollRight}
          className="absolute -right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#D0C5BD] bg-white text-[#141312] shadow-md transition-all hover:scale-105 hover:bg-[#FAF8F5] sm:flex"
        >
          <Icon name="chevron_right" size={20} />
        </button>
      </div>

      {/* Mobile Dot indicators */}
      <div className="mt-3 flex items-center justify-center gap-1.5 sm:hidden">
        {displayList.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Lihat produk ${i + 1}`}
            onClick={() => {
              if (!scrollRef.current) return;
              const card = scrollRef.current.children[i] as HTMLElement;
              if (card) {
                card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
              }
              setActiveIndex(i);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              activeIndex === i ? 'w-5 bg-[#141312]' : 'w-1.5 bg-[#D0C5BD]'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
