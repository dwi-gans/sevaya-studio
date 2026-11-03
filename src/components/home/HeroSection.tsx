'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getSiteSections, getCachedSiteSections, DEFAULT_SITE_SECTIONS, HeroSectionData } from '@/integrations/supabase';

const PRIMARY_HERO = '/images/hero_optimized.jpg';
const SECONDARY_HERO = '/images/hero_clean.jpg';

function isValidImage(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return false;
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return false;
  return true;
}

export function HeroSection() {
  const [hero, setHero] = useState<HeroSectionData>(DEFAULT_SITE_SECTIONS.hero);
  const [imgSrc, setImgSrc] = useState<string>(() => {
    const defaultImg = DEFAULT_SITE_SECTIONS.hero?.image;
    return isValidImage(defaultImg) ? defaultImg!.trim() : PRIMARY_HERO;
  });
  const [fallbackLevel, setFallbackLevel] = useState<number>(0);

  useEffect(() => {
    // Purge corrupted / stale blob cache from localStorage in this browser profile
    try {
      const raw = localStorage.getItem('sevaya_site_sections');
      if (raw && (raw.includes('blob:') || raw.includes('"image":""') || raw.includes('"image":"undefined"'))) {
        localStorage.removeItem('sevaya_site_sections');
      }
    } catch {
      // ignore
    }

    // Try localStorage cache first for instant render
    const cached = getCachedSiteSections();
    if (cached?.hero) {
      setHero(cached.hero);
      if (isValidImage(cached.hero.image)) {
        setImgSrc(cached.hero.image.trim());
      }
    }

    getSiteSections().then((sections) => {
      if (sections?.hero) {
        setHero(sections.hero);
        if (isValidImage(sections.hero.image)) {
          setImgSrc(sections.hero.image.trim());
        }
      }
    });
  }, []);

  const handleImageError = () => {
    if (fallbackLevel === 0) {
      // Step 1: Fallback to primary local hero
      setFallbackLevel(1);
      setImgSrc(PRIMARY_HERO);
    } else if (fallbackLevel === 1) {
      // Step 2: Fallback to secondary local hero
      setFallbackLevel(2);
      setImgSrc(SECONDARY_HERO);
    } else {
      // Step 3: Pure static fallback
      setFallbackLevel(3);
    }
  };

  const currentImageSrc = isValidImage(imgSrc) ? imgSrc : PRIMARY_HERO;

  return (
    <section className="relative flex h-[82vh] min-h-[560px] w-full flex-col justify-end overflow-hidden bg-[#111111] text-white section--dark sm:h-[86vh] md:min-h-[720px] lg:h-[90vh] lg:min-h-[780px]">
      {/* Background Hero Image with smooth Ken Burns animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="relative h-full w-full animate-kenburns">
          {fallbackLevel < 2 ? (
            <Image
              key={`${currentImageSrc}-${fallbackLevel}`}
              src={currentImageSrc}
              alt="SEVAYA Collection - Timeless, Intentional, Effortless"
              fill
              priority
              sizes="100vw"
              quality={85}
              className="object-cover object-[center_30%] sm:object-[center_35%]"
              onError={handleImageError}
            />
          ) : (
            /* Resilient native img fallback if Next.js image optimizer fails on this browser */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fallbackLevel === 2 ? SECONDARY_HERO : PRIMARY_HERO}
              alt="SEVAYA Collection - Timeless, Intentional, Effortless"
              className="h-full w-full object-cover object-[center_30%] sm:object-[center_35%]"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== SECONDARY_HERO) {
                  target.src = SECONDARY_HERO;
                }
              }}
            />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-6 pb-24 text-center text-white sm:pb-32 md:pb-36 lg:pb-40">
        {/* Tagline: Heading/Hero Brand Text selalu English */}
        <p className="animate-hero-fadeup-title mb-4 text-[9px] font-normal tracking-[0.28em] text-white/95 uppercase drop-shadow-sm sm:text-[10px]">
          TIMELESS • INTENTIONAL • EFFORTLESS
        </p>

        {/* CTA Buttons: Selalu English */}
        <div className="animate-hero-fadeup-link flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5">
          <Link
            href="/shop"
            className="inline-flex min-w-[160px] items-center justify-center bg-white px-5 py-3 text-[10px] font-semibold tracking-[0.2em] text-black uppercase transition-all duration-300 hover:bg-white/90 hover:scale-[1.02]"
          >
            {hero.ctaShop || 'Shop The Collection'}
          </Link>

          <Link
            href="/lookbook"
            className="inline-flex min-w-[160px] items-center justify-center border border-white bg-transparent px-5 py-3 text-[10px] font-semibold tracking-[0.2em] text-white uppercase transition-all duration-300 hover:bg-white hover:text-black"
          >
            {hero.ctaLookbook || 'Lookbook'}
          </Link>
        </div>
      </div>
    </section>
  );
}