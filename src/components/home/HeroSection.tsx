'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSiteSections, DEFAULT_SITE_SECTIONS, HeroSectionData } from '@/integrations/supabase';

// Fallback lokal — ditanam langsung sebagai background-image CSS (zero-delay, no network)
const PRIMARY_HERO = '/images/hero_optimized.webp';

interface HeroSectionProps {
  initialHero?: HeroSectionData;
}

export function HeroSection({ initialHero }: HeroSectionProps) {
  const [hero, setHero] = useState<HeroSectionData>(() => {
    if (initialHero && initialHero.image) {
      return initialHero;
    }
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('sevaya_site_sections');
        if (stored) {
          const parsed = JSON.parse(stored);
          const rawHeroImg = parsed?.hero?.image;
          if (
            rawHeroImg &&
            typeof rawHeroImg === 'string' &&
            !rawHeroImg.startsWith('blob:') &&
            rawHeroImg !== 'undefined' &&
            rawHeroImg !== 'null'
          ) {
            return { ...DEFAULT_SITE_SECTIONS.hero, ...parsed.hero };
          }
        }
      } catch {
        // ignore
      }
    }
    return initialHero || DEFAULT_SITE_SECTIONS.hero;
  });

  useEffect(() => {
    // Jika ada data SSR, gunakan langsung
    if (initialHero?.image) {
      setHero(initialHero);
      return;
    }

    // Background refresh: update hanya jika data Supabase berbeda
    getSiteSections().then((sections) => {
      if (sections?.hero) {
        setHero((prev) => {
          const s = sections.hero;
          if (
            s.image === prev.image &&
            s.mobileImage === prev.mobileImage &&
            s.position === prev.position &&
            s.mobilePosition === prev.mobilePosition &&
            s.badge === prev.badge &&
            s.ctaShop === prev.ctaShop &&
            s.ctaLookbook === prev.ctaLookbook
          ) {
            return prev;
          }
          return s;
        });
      }
    });
  }, [initialHero]);

  const rawDesktop = (hero?.image && hero.image.trim()) || PRIMARY_HERO;
  const desktopHeroImage =
    rawDesktop.startsWith('blob:') || rawDesktop === 'undefined' ? PRIMARY_HERO : rawDesktop;

  const rawMobile = hero?.mobileImage?.trim();
  const hasCustomMobile = Boolean(
    rawMobile &&
    rawMobile !== PRIMARY_HERO &&
    rawMobile !== desktopHeroImage &&
    !rawMobile.startsWith('blob:') &&
    rawMobile !== 'undefined'
  );
  const mobileHeroImage = hasCustomMobile ? rawMobile! : desktopHeroImage;

  // State fallback dinamis jika URL gambar remote lambat/gagal/offline
  const [desktopSrc, setDesktopSrc] = useState(desktopHeroImage);
  const [mobileSrc, setMobileSrc] = useState(mobileHeroImage);

  useEffect(() => {
    setDesktopSrc(desktopHeroImage);
    setMobileSrc(mobileHeroImage);
  }, [desktopHeroImage, mobileHeroImage]);

  // Gambar fallback ditanam langsung di CSS style section sebagai background instan
  // Menggunakan warna hangat charcoal/bronze gelap daripada hitam pekat agar tidak 'mati' saat loading
  const bgStyle: React.CSSProperties = {
    backgroundImage: `url(${desktopSrc})`,
    backgroundSize: 'cover',
    backgroundPosition: hero?.position || 'center',
    backgroundColor: '#1C1917',
  };

  return (
    <section
      suppressHydrationWarning
      className="relative flex w-full flex-col justify-end overflow-hidden text-white h-[calc(100svh-4rem)] sm:h-[calc(100dvh-4rem)] min-h-[500px]"
      style={bgStyle}
    >
      {/* Background Hero Image — di atas CSS bg agar kualitas lebih tajam saat loaded */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          suppressHydrationWarning
          className="relative h-full w-full animate-hero-zoom"
        >
          {hasCustomMobile ? (
            <>
              {/* Mobile (< 640px) */}
              <img
                suppressHydrationWarning
                src={mobileSrc}
                alt="SEVAYA Collection - Timeless, Intentional, Effortless"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="block sm:hidden h-full w-full object-cover"
                style={{
                  imageRendering: 'auto',
                  objectPosition: hero?.mobilePosition || hero?.position || 'center',
                }}
                onError={() => {
                  console.warn('[Hero] Mobile hero image failed to load, falling back to local asset');
                  setMobileSrc(PRIMARY_HERO);
                }}
              />
              {/* Desktop (>= 640px) */}
              <img
                suppressHydrationWarning
                src={desktopSrc}
                alt="SEVAYA Collection - Timeless, Intentional, Effortless"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="hidden sm:block h-full w-full object-cover"
                style={{
                  imageRendering: 'auto',
                  objectPosition: hero?.position || 'center',
                }}
                onError={() => {
                  console.warn('[Hero] Desktop hero image failed to load, falling back to local asset');
                  setDesktopSrc(PRIMARY_HERO);
                }}
              />
            </>
          ) : (
            <img
              suppressHydrationWarning
              src={desktopSrc}
              alt="SEVAYA Collection - Timeless, Intentional, Effortless"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover"
              style={{
                imageRendering: 'auto',
                objectPosition: hero?.position || 'center',
              }}
              onError={() => {
                console.warn('[Hero] Hero image failed to load, falling back to local asset');
                setDesktopSrc(PRIMARY_HERO);
              }}
            />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent pointer-events-none" />
      </div>

      {/* Content — posisi seimbang di mobile sesuai permintaan user */}
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-4 sm:px-6 pb-11 text-center text-white sm:pb-16 md:pb-20 lg:pb-24">
        {/* Tagline */}
        <p className="mb-3 sm:mb-4 text-[8.5px] font-normal tracking-[0.22em] sm:tracking-[0.28em] text-white/95 uppercase drop-shadow-sm sm:text-[10px] animate-hero-fadeup-title">
          {hero.badge || 'TIMELESS • INTENTIONAL • EFFORTLESS'}
        </p>

        {/* CTA Buttons - Selalu menyamping berdampingan (flex-row) di mobile & desktop */}
        <div className="flex flex-row items-center justify-center gap-2 sm:gap-4 w-full max-w-sm sm:max-w-md px-2 animate-hero-fadeup-link">
          <Link
            href="/shop"
            className="flex-1 sm:flex-none inline-flex min-w-[118px] sm:min-w-[160px] items-center justify-center bg-white px-3 py-2 sm:px-5 sm:py-3 text-[8.5px] sm:text-[10px] font-semibold tracking-[0.16em] sm:tracking-[0.2em] text-black uppercase transition-all duration-300 hover:bg-white/90 active:scale-95 whitespace-nowrap text-center shadow-xs"
          >
            {hero.ctaShop || 'Shop The Collection'}
          </Link>

          <Link
            href="/lookbook"
            className="flex-1 sm:flex-none inline-flex min-w-[118px] sm:min-w-[160px] items-center justify-center border border-white bg-transparent px-3 py-2 sm:px-5 sm:py-3 text-[8.5px] sm:text-[10px] font-semibold tracking-[0.16em] sm:tracking-[0.2em] text-white uppercase transition-all duration-300 hover:bg-white hover:text-black active:scale-95 whitespace-nowrap text-center shadow-xs"
          >
            {hero.ctaLookbook || 'Lookbook'}
          </Link>
        </div>
      </div>
    </section>
  );
}