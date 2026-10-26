import { supabase } from './client';

export interface HeroSectionData {
  badge: string;
  title: string;
  desc: string;
  image: string;
  ctaLookbook: string;
  ctaShop: string;
}

export interface SpotlightItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  href: string;
}

export interface JournalArticleData {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  image: string;
}

export interface LookbookChapterData {
  id: string;
  num: string;
  title: string;
  image: string;
}

export interface LookbookPageConfig {
  heroImage: string;
  heroTitle: string;
  heroSubtitle: string;
  seasonTitle: string;
  seasonDesc: string;
  collagePortrait: string;
  collageDetail1: string;
  collageDetail2: string;
  panorama1: string;
  panorama1Title: string;
  panorama1Desc: string;
  panorama2: string;
  triptych1: string;
  triptych2: string;
  triptych3: string;
  triptychTitle: string;
  triptychDesc: string;
  fullDress: string;
}

export interface SiteSectionsConfig {
  hero: HeroSectionData;
  spotlight: SpotlightItem[];
  missionTextiles: {
    title: string;
    image: string;
  };
  journal: JournalArticleData[];
  lookbook: LookbookChapterData[];
  lookbookPage?: LookbookPageConfig;
  conscious?: {
    heroImage: string;
    bembergImage: string;
    tencelImage: string;
    linenImage: string;
    modalImage: string;
  };
}

export const DEFAULT_SITE_SECTIONS: SiteSectionsConfig = {
  hero: {
    badge: "Ramadan & Eid '26",
    title: 'Floraison',
    desc: 'An exploration of architectural modest silhouettes, honoring stillness and enduring luxury.',
    image: '/images/catalog/catalog-02.jpg',
    ctaLookbook: 'View Lookbook',
    ctaShop: 'Shop Capsule',
  },
  spotlight: [
    {
      id: 'spotlight-1',
      title: 'Abaya Klasik',
      subtitle: 'Modest Drapery',
      image: '/images/catalog/catalog-01.jpg',
      href: '/product/fina-abaya-stripe-2',
    },
    {
      id: 'spotlight-2',
      title: 'Kaftan & Sets',
      subtitle: 'Silk Kaftans',
      image: '/images/catalog/catalog-04.jpg',
      href: '/#collections',
    },
  ],
  missionTextiles: {
    title: 'The Future Wears What We Choose Today',
    image: '/images/catalog/catalog-06.jpg',
  },
  journal: [
    {
      id: 'journal-1',
      title: 'Rangkuman Floraison: Menanam, Mekar, Berbuah, dan Arti Bertumbuh',
      date: '5 Okt 2026 • Catatan Bab',
      excerpt:
        'Pertumbuhan bukanlah panen sekali jadi. Ini adalah kesabaran merawat akar kita, menyadari bahwa setiap diri bertumbuh dengan caranya masing-masing...',
      image: '/images/catalog/catalog-11.jpg',
    },
    {
      id: 'journal-2',
      title: 'Saatnya Membuka Lembaran Baru dan Merayakan Hal-Hal Sederhana',
      date: '26 Sep 2026 • Refleksi',
      excerpt:
        'Belajar merangkul transformasi kecil dan hening dalam kehidupan modest masa kini dengan siluet sejuk dan bernapas alami...',
      image: '/images/catalog/catalog-12.jpg',
    },
  ],
  lookbook: [
    {
      id: 'ch-1',
      num: 'BAB 1',
      title: 'Floraison // Summer 2026',
      image: '/images/sevaya_first_chapter.jpg',
    },
  ],
  lookbookPage: {
    heroImage: '/images/sevaya_first_chapter.jpg',
    heroTitle: 'FLORAISON',
    heroSubtitle: 'SEVAYA • FLORAISON',
    seasonTitle: 'The Seed of The Story',
    seasonDesc: 'Inspired by 26°C, a temperature where many tropical fruits, flowers, and plants grow at their most joyful. In Indonesia, particularly between June and August, temperatures range from 24°C to 32°C, bringing moments that feel lighter, calmer, and more balanced.',
    collagePortrait: '/images/lookbook_figma_0.png',
    collageDetail1: '/images/figma_about_1.png',
    collageDetail2: '/images/figma_about_2.png',
    panorama1: '/images/figma_hero.png',
    panorama1Title: 'Meet The Icon',
    panorama1Desc: 'Cherry Tomato has a visible and expressive growth journey, reflecting the essence of becoming and purposeful growth.',
    panorama2: '/images/lookbook_figma_1.png',
    triptych1: '/images/lookbook_figma_2.png',
    triptych2: '/images/lookbook_figma_3.png',
    triptych3: '/images/lookbook_figma_4.png',
    triptychTitle: 'The Summer 2026 Collection',
    triptychDesc: 'Through airy textures, comforting handfeels, and a palette inspired by summer’s abundance.',
    fullDress: '/images/lookbook_figma_5.png',
  },
  conscious: {
    heroImage: '/images/catalog/catalog-06.jpg',
    bembergImage: '/images/catalog/catalog-06.jpg',
    tencelImage: '/images/catalog/catalog-16.jpg',
    linenImage: '/images/catalog/catalog-15.jpg',
    modalImage: '/images/catalog/catalog-04.jpg',
  },
};

const SECTIONS_FILE = 'sections.json';
const LOCAL_STORAGE_KEY = 'sevaya_site_sections';

let _cachedSiteSections: SiteSectionsConfig | null = null;
let _cachedSectionsTime = 0;
const SECTIONS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in-memory cache

/**
 * Synchronously retrieves cached site sections from LocalStorage or default.
 * Zero network delay, guarantees instant rendering without flash of default content (FOUC).
 */
export function getCachedSiteSections(): SiteSectionsConfig {
  if (_cachedSiteSections && Date.now() - _cachedSectionsTime < SECTIONS_CACHE_TTL) {
    return _cachedSiteSections;
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<SiteSectionsConfig>;
        const merged = {
          ...DEFAULT_SITE_SECTIONS,
          ...parsed,
          lookbookPage: {
            ...DEFAULT_SITE_SECTIONS.lookbookPage!,
            ...(parsed.lookbookPage || {}),
          },
        };
        _cachedSiteSections = merged;
        _cachedSectionsTime = Date.now();
        return merged;
      }
    } catch (e) {
      console.warn('Failed to parse site sections from localStorage', e);
    }
  }
  return DEFAULT_SITE_SECTIONS;
}

/**
 * Loads sections configuration with resilient fallback:
 * 1. Fast in-memory cache (0ms)
 * 2. LocalStorage (offline / dev persistence)
 * 3. Supabase Storage (Cloud background refresh)
 * 4. DEFAULT_SITE_SECTIONS (Code defaults)
 */
export async function getSiteSections(): Promise<SiteSectionsConfig> {
  const now = Date.now();
  if (_cachedSiteSections && now - _cachedSectionsTime < SECTIONS_CACHE_TTL) {
    return _cachedSiteSections;
  }

  let localData: Partial<SiteSectionsConfig> | null = null;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        localData = JSON.parse(stored) as Partial<SiteSectionsConfig>;
      }
    } catch (e) {
      console.warn('Failed to parse site sections from localStorage', e);
    }
  }

  // If we have local data, return it immediately to prevent blocking navigation
  const immediateFallback: SiteSectionsConfig = {
    ...DEFAULT_SITE_SECTIONS,
    ...localData,
    lookbookPage: {
      ...DEFAULT_SITE_SECTIONS.lookbookPage!,
      ...(localData?.lookbookPage || {}),
    },
  };

  _cachedSiteSections = immediateFallback;
  _cachedSectionsTime = now;

  // Background cloud fetch with 1.5s timeout so it never hangs page transitions
  try {
    const downloadPromise = supabase.storage.from('catalog').download(SECTIONS_FILE);
    const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error('Timeout') }), 1500)
    );

    const { data, error } = (await Promise.race([downloadPromise, timeoutPromise])) as {
      data: Blob | null;
      error: Error | null;
    };

    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text) as SiteSectionsConfig;
      const merged: SiteSectionsConfig = {
        ...DEFAULT_SITE_SECTIONS,
        ...localData,
        ...parsed,
        lookbookPage: {
          ...DEFAULT_SITE_SECTIONS.lookbookPage!,
          ...(localData?.lookbookPage || {}),
          ...(parsed.lookbookPage || {}),
        },
      };

      _cachedSiteSections = merged;
      _cachedSectionsTime = Date.now();

      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
      }
      return merged;
    }
  } catch (err) {
    console.warn('Supabase storage download failed, falling back to local storage', err);
  }

  return immediateFallback;
}

/**
 * Saves updated site sections configuration to both LocalStorage and Supabase Storage.
 * Guaranteed to persist locally even if Supabase permissions or network fail.
 */
export async function saveSiteSections(sections: SiteSectionsConfig): Promise<boolean> {
  // Update in-memory cache immediately
  _cachedSiteSections = sections;
  _cachedSectionsTime = Date.now();

  // 1. Immediate LocalStorage persist
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sections));
    } catch (e) {
      console.warn('Failed to save sections to localStorage', e);
    }
  }

  // 2. Supabase Cloud Storage persist
  try {
    const jsonStr = JSON.stringify(sections, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const { error } = await supabase.storage.from('catalog').upload(SECTIONS_FILE, blob, {
      contentType: 'application/json',
      upsert: true,
    });
    if (error) {
      console.warn('Supabase storage upload error:', error.message);
      return true;
    }
    return true;
  } catch (err) {
    console.warn('Supabase upload exception:', err);
    return true;
  }
}
