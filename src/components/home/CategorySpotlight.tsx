'use client';

import React, { useEffect, useState, useLayoutEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getSiteSections, getCachedSiteSections, DEFAULT_SITE_SECTIONS } from '@/integrations/supabase';

export function CategorySpotlight() {
  const [spotlight, setSpotlight] = useState(DEFAULT_SITE_SECTIONS.spotlight);

  useLayoutEffect(() => {
    const cached = getCachedSiteSections();
    if (cached?.spotlight?.length) setSpotlight(cached.spotlight);
  }, []);

  useEffect(() => {
    getSiteSections().then((sections) => {
      if (sections.spotlight?.length) setSpotlight(sections.spotlight);
    });
  }, []);

  const abaya = spotlight[0];
  const khimar = spotlight[1];

  return (
    <section className="w-full bg-white py-8 text-black section--light"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Intro Subtext */}
      <div className="mb-4 text-center sm:mb-5">
        <p className="mx-auto max-w-3xl text-[10px] leading-relaxed text-black/60 sm:text-[11px]">
          Discover modestwear designed for women who embrace their faith, pursue their ambitions, and move through life with confidence. Timeless design, effortless comfort, and thoughtful details for a life of purpose.
        </p>
      </div>

      {/* 2 Category Banners: ABAYA & KHIBAN */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        {/* Banner 1: ABAYA */}
        <Link
          href="/shop?category=abaya"
          className="group relative block aspect-[3/4] w-full overflow-hidden sm:aspect-[4/3] bg-black/5 border border-black/10 shadow-xs"
        >
          <Image
            src={abaya?.image || '/images/figma_abaya_banner.png'}
            alt={abaya?.title || 'ABAYA Collection'}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent transition-opacity group-hover:opacity-90" />
          <div className="absolute bottom-3 left-3 z-10 sm:bottom-6 sm:left-6">
            <span className="font-sans text-[9px] font-semibold tracking-[0.2em] text-white uppercase drop-shadow-md sm:text-xs">
              ABAYA
            </span>
          </div>
        </Link>

        {/* Banner 2: KHIBAN */}
        <Link
          href="/shop?category=khimar"
          className="group relative block aspect-[3/4] w-full overflow-hidden sm:aspect-[4/3] bg-black/5 border border-black/10 shadow-xs"
        >
          <Image
            src={khimar?.image || '/images/khiban-banner-v2.jpg'}
            alt={khimar?.title || 'KHIBAN Collection'}
            fill
            className="object-cover object-top sm:object-center transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent transition-opacity group-hover:opacity-90" />
          <div className="absolute bottom-3 left-3 z-10 sm:bottom-6 sm:left-6">
            <span className="font-sans text-[9px] font-semibold tracking-[0.2em] text-white uppercase drop-shadow-md sm:text-xs">
              KHIMAR
            </span>
          </div>
        </Link>
      </div>
    </div></section>
  );
}
