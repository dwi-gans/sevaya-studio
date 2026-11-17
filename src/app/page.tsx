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

// ISR: cache homepage 60 detik — drastis lebih cepat di HP karena tidak perlu
// SSR dari nol untuk setiap visitor. Data produk & sections update tiap 60 detik.
export const revalidate = 60;

export default async function HomePage() {
  const [products, sections, latestArticles] = await Promise.all([
    fetchCatalogProducts().catch((err) => {
      console.warn('fetchCatalogProducts fallback error:', err);
      return [];
    }),
    getSiteSections(false).catch((err) => {
      console.warn('getSiteSections fallback error:', err);
      return DEFAULT_SITE_SECTIONS;
    }),
    getLatestArticlesForJournal(3).catch((err) => {
      console.warn('getLatestArticlesForJournal fallback error:', err);
      return [];
    }),
  ]);

  const activeProducts =
    Array.isArray(products) && products.length > 0 ? products : DEFAULT_BEST_SELLERS;
  const activeSections = sections || DEFAULT_SITE_SECTIONS;

  // Susun artikel jurnal: ikuti urutan pilihan admin (via href/slug) tapi selalu pakai gambar & data terbaru dari DB.
  // Pastikan selalu genap 3 artikel agar tampil 3 kotak di beranda (desktop & mobile).
  let journalArticles: typeof DEFAULT_SITE_SECTIONS.journal = [];
  const adminJournal = activeSections?.journal || [];

  if (latestArticles && latestArticles.length > 0) {
    const hydrated = adminJournal.map((slot) => {
      const slugFromHref = slot.href ? slot.href.split('/').pop() : null;
      const dbArticle = slugFromHref
        ? latestArticles.find((a) => a.href.endsWith(`/${slugFromHref}`))
        : null;
      // Kalau artikel dari slot admin ditemukan di DB, gunakan data DB (gambar terbaru)
      // Kalau tidak ditemukan (artikel dihapus/belum publish), gunakan data slot admin apa adanya
      return dbArticle ?? slot;
    });

    // Jika adminJournal kurang dari 3, tambahkan artikel terbaru dari DB agar selalu 3 kotak
    const usedSlugs = new Set(
      hydrated
        .map((h) => (h.href ? h.href.split('/').pop() : ''))
        .filter(Boolean)
    );
    for (const art of latestArticles) {
      if (hydrated.length >= 3) break;
      const artSlug = art.href ? art.href.split('/').pop() : '';
      if (artSlug && !usedSlugs.has(artSlug)) {
        hydrated.push(art);
        usedSlugs.add(artSlug);
      }
    }
    journalArticles = hydrated.slice(0, 3);
  } else if (adminJournal.length > 0) {
    journalArticles = [...adminJournal];
  }

  // Pengaman jika masih kurang dari 3: lengkapi dari DEFAULT_SITE_SECTIONS.journal
  if (journalArticles.length < 3) {
    const usedSlugs = new Set(
      journalArticles
        .map((h) => (h.href ? h.href.split('/').pop() : ''))
        .filter(Boolean)
    );
    for (const def of DEFAULT_SITE_SECTIONS.journal) {
      if (journalArticles.length >= 3) break;
      const defSlug = def.href ? def.href.split('/').pop() : '';
      if (!defSlug || !usedSlugs.has(defSlug)) {
        journalArticles.push(def);
        if (defSlug) usedSlugs.add(defSlug);
      }
    }
  }

  return (
    <main className="relative flex min-h-screen w-full flex-col bg-[#FFFFFF]">
      {/* Semantic H1 for Googlebot and Screen Readers */}
      <h1 className="sr-only">
        SEVAYA Studio — Koleksi Busana Abaya & French Khimar Modern Indonesia
      </h1>

      {/* 1. Hero Section matching Figma: TIMELESS • INTENTIONAL • EFFORTLESS */}
      <HeroSection initialHero={activeSections?.hero} />

      {/* 2. Best Sellers Carousel — Hanya kirim 8 produk unggulan ke homepage (ringan & cepat) */}
      <ProductGrid products={activeProducts.slice(0, 8)} />

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
