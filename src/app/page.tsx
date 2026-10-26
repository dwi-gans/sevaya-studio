import React from 'react';
import { HeroSection } from '@/components/home/HeroSection';
import { ProductGrid } from '@/components/home/ProductGrid';
import { CategorySpotlight } from '@/components/home/CategorySpotlight';
import { NarrativeSection } from '@/components/home/NarrativeSection';
import { JournalSection } from '@/components/home/JournalSection';
import { Footer } from '@/components/layout/Footer';
import { fetchCatalogProducts } from '@/features/catalog';

export default async function HomePage() {
  const products = await fetchCatalogProducts();

  return (
    <main className="relative flex min-h-screen w-full flex-col bg-[#FAF8F5]">
      {/* 1. Hero Section matching Figma: TIMELESS • INTENTIONAL • EFFORTLESS */}
      <HeroSection />

      {/* 2. Best Sellers Carousel */}
      <ProductGrid products={products} />

      {/* 3. Category Split Banners: ABAYA & KHIBAN */}
      <CategorySpotlight />

      {/* 4. Narrative: Elegance in Simplicity, Video Showcase, Brand Pillars, About SEVAYA 2-photo split, Trust Badges */}
      <NarrativeSection />

      {/* 5. Our Reading Corner (Prestigious Journals) */}
      <JournalSection />

      {/* 6. Footer (4 Columns + Newsletter) */}
      <Footer />
    </main>
  );
}
