'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getSiteSections, getCachedSiteSections, DEFAULT_SITE_SECTIONS } from '@/integrations/supabase';

export function CategorySpotlight() {
  const [spotlight, setSpotlight] = useState(DEFAULT_SITE_SECTIONS.spotlight);

  useEffect(() => {
    // 1. Read cached immediately (no flash)
    const cached = getCachedSiteSections();
    if (cached.spotlight?.length) {
      setSpotlight(cached.spotlight);
    }
    // 2. Refresh from cloud in background
    getSiteSections().then((sections) => {
      if (sections.spotlight?.length) {
        setSpotlight(sections.spotlight);
      }
    });
  }, []);

  const abaya = spotlight[0];
  const khimar = spotlight[1];

  return (
    <section className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Intro Subtext */}
      <div className="mb-5 text-center sm:mb-8">
        <p className="mx-auto max-w-3xl text-xs leading-relaxed text-[#554C48] sm:text-sm md:text-base">
          Discover modestwear designed to make everyday dressing feel effortless. Rooted in timeless
          aesthetics, considered details, and a more thoughtful approach to fashion.
        </p>
      </div>

      {/* 2 Category Banners: ABAYA & KHIBAN */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        {/* Banner 1: ABAYA */}
        <Link
          href="/shop?category=abaya"
          className="group relative block aspect-[3/4] w-full overflow-hidden rounded-xl sm:aspect-[4/3] bg-[#FAF8F5] shadow-xs"
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
            <span className="font-sans text-xs font-semibold tracking-[0.2em] text-white uppercase drop-shadow-md sm:text-base">
              {abaya?.title || 'ABAYA'}
            </span>
          </div>
        </Link>

        {/* Banner 2: KHIBAN */}
        <Link
          href="/shop?category=khimar"
          className="group relative block aspect-[3/4] w-full overflow-hidden rounded-xl sm:aspect-[4/3] bg-[#FAF8F5] shadow-xs"
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
            <span className="font-sans text-xs font-semibold tracking-[0.2em] text-white uppercase drop-shadow-md sm:text-base">
              {khimar?.title || 'KHIBAN'}
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}
