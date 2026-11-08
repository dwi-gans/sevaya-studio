import React from 'react';
import {
  HeroSection,
  ProductGrid,
  CloserLookSection,
  CategorySpotlight,
  NarrativeSection,
  JournalSection,
  Footer,
} from '@/components/sections';
import { DEFAULT_BEST_SELLERS } from '@/components/home/ProductGrid';
import { fetchCatalogProducts } from '@/features/catalog';
import { getSiteSections, getLatestArticlesForJournal, DEFAULT_SITE_SECTIONS } from '@/integrations/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const [products, sections, latestArticles] = await Promise.all([
    fetchCatalogProducts().catch((err) => {
      console.warn('fetchCatalogProducts fallback error:', err);
      return [];
    }),
    getSiteSections(true).catch((err) => {
      console.warn('getSiteSections fallback error:', err);
      return DEFAULT_SITE_SECTIONS;
    }),
    getLatestArticlesForJournal(2).catch((err) => {
      console.warn('getLatestArticlesForJournal fallback error:', err);
      return [];
    }),
  ]);

  const activeProducts =
    Array.isArray(products) && products.length > 0 ? products : DEFAULT_BEST_SELLERS;
  const activeSections = sections || DEFAULT_SITE_SECTIONS;

  // Gunakan artikel terbaru dari DB jika ada; fallback ke activeSections.journal (manual config)
  const journalArticles =
    latestArticles && latestArticles.length > 0
      ? latestArticles
      : activeSections?.journal || DEFAULT_SITE_SECTIONS.journal;

  return (
    <main className="relative flex min-h-screen w-full flex-col bg-[#FFFFFF]">
      {/* 1. Hero Section matching Figma: TIMELESS • INTENTIONAL • EFFORTLESS */}
      <HeroSection initialHero={activeSections?.hero} />

      {/* 2. Best Sellers Carousel */}
      <ProductGrid products={activeProducts} />

      {/* 2.5 Editorial Collection Spotlight: A Closer Look At 26°Rhapsody */}
      <CloserLookSection initialData={activeSections?.closerLook} />

      {/* 3. Category Split Banners: ABAYA & KHIMAR */}
      <CategorySpotlight
        initialSpotlight={activeSections?.spotlight}
      />

      {/* 4. Narrative: Elegance in Simplicity, Video Showcase, Brand Pillars, About SEVAYA 2-photo split, Trust Badges */}
      <NarrativeSection initialNarrative={activeSections?.narrative} />

      {/* 5. Our Reading Corner — artikel otomatis dari DB articles terbaru */}
      <JournalSection
        initialArticles={journalArticles}
        initialHeader={activeSections?.journalHeader}
      />

      {/* 6. Footer (4 Columns + Newsletter) */}
      <Footer />
    </main>
  );
}
