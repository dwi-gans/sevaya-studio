import React from 'react';
import { HeroSection } from '@/components/home/HeroSection';
import { ProductGrid } from '@/components/home/ProductGrid';
import { CategorySpotlight } from '@/components/home/CategorySpotlight';
import { NarrativeSection } from '@/components/home/NarrativeSection';
import { JournalSection } from '@/components/home/JournalSection';

export type SectionKey =
  | 'hero'
  | 'best_sellers'
  | 'spotlight'
  | 'narrative'
  | 'journal';

export interface SectionMetadata {
  key: SectionKey;
  label: string;
  description: string;
}

export const SECTION_METADATA: Record<SectionKey, SectionMetadata> = {
  hero: {
    key: 'hero',
    label: 'Hero Banner',
    description: 'Headline visual utama, tagline, dan CTA ke koleksi',
  },
  best_sellers: {
    key: 'best_sellers',
    label: 'Koleksi Unggulan (Product Grid)',
    description: 'Katalog best seller, filter kategori, dan tombol cepat beli',
  },
  spotlight: {
    key: 'spotlight',
    label: 'Sorotan Kategori (Abaya & Khimar)',
    description: 'Split visual banner dua kategori utama',
  },
  narrative: {
    key: 'narrative',
    label: 'Brand Narrative & Pillars',
    description: 'Cerita filosofi brand, video showcase, dan nilai pilar',
  },
  journal: {
    key: 'journal',
    label: 'Reading Corner (Jurnal)',
    description: 'Artikel editorial dan inspirasi gaya terbaru',
  },
};

/**
 * Default order of home sections.
 * Can be rearranged or extended with new section keys without touching complex layout code.
 */
export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  'hero',
  'best_sellers',
  'spotlight',
  'narrative',
  'journal',
];
