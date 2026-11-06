import React from 'react';
import { HeroSection } from '@/components/home/HeroSection';
import { ProductGrid } from '@/components/home/ProductGrid';
import { CategorySpotlight } from '@/components/home/CategorySpotlight';
import { NarrativeSection } from '@/components/home/NarrativeSection';
import { JournalSection } from '@/components/home/JournalSection';
import { Footer } from '@/components/layout/Footer';
import { fetchCatalogProducts } from '@/features/catalog';
import { getSiteSections, getLatestArticlesForJournal } from '@/integrations/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const [products, sections, latestArticles] = await Promise.all([
    fetchCatalogProducts(),
    getSiteSections(true),
    getLatestArticlesForJournal(2),
  ]);

  // Gunakan artikel terbaru dari DB jika ada; fallback ke sections.journal (manual config)
  const journalArticles =
    latestArticles.length > 0 ? latestArticles : sections?.journal;

  return (
    <main className="relative flex min-h-screen w-full flex-col bg-[#FFFFFF]">
      {/* 1. Hero Section matching Figma: TIMELESS • INTENTIONAL • EFFORTLESS */}
      <HeroSection initialHero={sections?.hero} />

      {/* 2. Best Sellers Carousel */}
      <ProductGrid products={products} />

      {/* 3. Category Split Banners: ABAYA & KHIMAR */}
      <CategorySpotlight
        initialSpotlight={sections?.spotlight}
        initialIntro={sections?.spotlightIntro}
      />

      {/* 4. Narrative: Elegance in Simplicity, Video Showcase, Brand Pillars, About SEVAYA 2-photo split, Trust Badges */}
      <NarrativeSection initialNarrative={sections?.narrative} />

      {/* 5. Our Reading Corner — artikel otomatis dari DB articles terbaru */}
      <JournalSection
        initialArticles={journalArticles}
        initialHeader={sections?.journalHeader}
      />

      {/* 6. Footer (4 Columns + Newsletter) */}
      <Footer />
    </main>
  );
}
