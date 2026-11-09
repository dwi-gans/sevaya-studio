'use client';

import React, { useRef } from 'react';
import { ProductCard, Product } from './ProductCard';
import { Icon } from '@/components/ui/Icon';
import { useLanguage } from '@/context/LanguageContext';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';

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
      { name: 'Dusty Pink', color: '#DCAEAA', image: '/images/catalog/catalog-01.jpg' },
      { name: 'Mocha', color: '#B28E78', image: '/images/catalog/catalog-02.jpg' },
      { name: 'Black', color: '#1A1A1A', image: '/images/catalog/catalog-01.jpg' },
      { name: 'Soft Rose', color: '#EBB4B0', image: '/images/catalog/catalog-02.jpg' },
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
      { name: 'Dusty Pink', color: '#DCAEAA', image: '/images/catalog/catalog-03.jpg' },
      { name: 'Mocha', color: '#B28E78', image: '/images/catalog/catalog-04.jpg' },
      { name: 'Black', color: '#1A1A1A', image: '/images/catalog/catalog-03.jpg' },
      { name: 'Soft Rose', color: '#EBB4B0', image: '/images/catalog/catalog-04.jpg' },
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
      { name: 'Dusty Pink', color: '#DCAEAA', image: '/images/catalog/catalog-18.jpg' },
      { name: 'Mocha', color: '#B28E78', image: '/images/catalog/catalog-17.jpg' },
      { name: 'Black', color: '#1A1A1A', image: '/images/catalog/catalog-18.jpg' },
      { name: 'Soft Rose', color: '#EBB4B0', image: '/images/catalog/catalog-17.jpg' },
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
      { name: 'Dusty Pink', color: '#DCAEAA', image: '/images/catalog/catalog-13.jpg' },
      { name: 'Mocha', color: '#B28E78', image: '/images/catalog/catalog-14.jpg' },
      { name: 'Black', color: '#1A1A1A', image: '/images/catalog/catalog-13.jpg' },
      { name: 'Soft Rose', color: '#EBB4B0', image: '/images/catalog/catalog-14.jpg' },
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
      { name: 'Sage Green', color: '#889A84', image: '/images/catalog/catalog-05.jpg' },
      { name: 'Black', color: '#1A1A1A', image: '/images/catalog/catalog-06.jpg' },
      { name: 'Rose', color: '#DBA8A0', image: '/images/catalog/catalog-05.jpg' },
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
      { name: 'Beige', color: '#D2BFA6', image: '/images/catalog/catalog-07.jpg' },
      { name: 'Black', color: '#1A1A1A', image: '/images/catalog/catalog-08.jpg' },
      { name: 'Mocha', color: '#B28E78', image: '/images/catalog/catalog-07.jpg' },
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
      { name: 'Grey', color: '#4A4E53', image: '/images/catalog/catalog-10.jpg' },
      { name: 'Black', color: '#1A1A1A', image: '/images/catalog/catalog-09.jpg' },
      { name: 'Cream', color: '#E5D6C5', image: '/images/catalog/catalog-10.jpg' },
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
      { name: 'Espresso', color: '#3A271E', image: '/images/catalog/catalog-15.jpg' },
      { name: 'Black', color: '#1A1A1A', image: '/images/catalog/catalog-16.jpg' },
      { name: 'Camel', color: '#A98263', image: '/images/catalog/catalog-15.jpg' },
    ],
  },
];

interface ProductGridProps {
  products?: Product[];
}

export function ProductGrid({ products = DEFAULT_BEST_SELLERS }: ProductGridProps) {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [scrollLeftPos, setScrollLeftPos] = React.useState(0);
  const [hasMoved, setHasMoved] = React.useState(false);

  const sortedList = React.useMemo(() => {
    const raw = products && products.length > 0 ? [...products] : [...DEFAULT_BEST_SELLERS];
    return raw.sort((a, b) => {
      const aBest = (a.badge || '').toLowerCase().includes('best') ? 1 : 0;
      const bBest = (b.badge || '').toLowerCase().includes('best') ? 1 : 0;
      if (aBest !== bBest) return bBest - aBest;

      const aTrend = (a.badge || '').toLowerCase().includes('trend') ? 1 : 0;
      const bTrend = (b.badge || '').toLowerCase().includes('trend') ? 1 : 0;
      if (aTrend !== bTrend) return bTrend - aTrend;

      return 0;
    });
  }, [products]);

  const displayList = sortedList.length >= 8 ? sortedList.slice(0, 8) : sortedList;

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
    <section className="w-full bg-white pt-6 pb-6 sm:py-8 text-black section--light" data-section="collections">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        {/* Top Header with subtle fade-up reveal - konsisten rata kiri di mobile & desktop */}
        <RevealOnScroll variant="fade-up" className="mb-5 flex flex-col gap-1 text-left">
          <span className="text-[8.5px] sm:text-[9px] font-medium tracking-[0.2em] text-black/60 uppercase">
            WORN &amp; LOVED
          </span>
          <h2 className="font-sans text-[13px] sm:text-sm font-medium tracking-wider text-black/85 uppercase">
            SHOP THE COLLECTION
          </h2>
        </RevealOnScroll>

        {/* Product Cards Row - sejajar rapi dengan header di kiri tanpa ruang kosong berlebih */}
        <RevealOnScroll variant="editorial" delayMs={80} className="relative">
          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClickCapture={handleClickCapture}
            className={`no-scrollbar flex gap-2.5 overflow-x-auto px-3 pb-4 touch-auto select-none sm:-mx-6 sm:gap-6 sm:px-6 md:mx-0 md:px-0 ${
              isDown ? 'cursor-grabbing scroll-auto' : 'cursor-grab scroll-smooth'
            }`}
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              scrollSnapType: isDown ? 'none' : 'x mandatory',
              overscrollBehaviorX: 'contain',
            }}
          >
            {displayList.map((p, i) => (
              <div
                key={`${p.id || 'prod'}-${p.slug || ''}-${i}`}
                className="w-[37vw] max-w-[155px] shrink-0 sm:max-w-none sm:w-[40vw] md:w-[285px] lg:w-[calc(25%-18px)] snap-start"
                style={{ scrollSnapAlign: 'start' }}
              >
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
