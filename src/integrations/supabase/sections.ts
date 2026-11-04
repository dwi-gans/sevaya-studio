// No direct Supabase client usage here — all reads/writes go through /api/sections
// which uses the Service Role Key on the server side.

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

export interface LookbookLinkItem {
  id: string;
  label: string;
  season?: string;
  href: string;
  badge?: string;
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
  lookbookLinks?: LookbookLinkItem[];
  lookbookPage?: LookbookPageConfig;
  lookbookVolumesConfig?: Record<string, LookbookPageConfig>;
  conscious?: {
    heroImage: string;
    bembergImage: string;
    tencelImage: string;
    linenImage: string;
    modalImage: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT — synchronized with actual Supabase / Admin state
// ─────────────────────────────────────────────────────────────────────────────
export const DEFAULT_SITE_SECTIONS: SiteSectionsConfig = {
  hero: {
    badge: "Ramadan & Eid '26",
    title: 'Floraison',
    desc: 'An exploration of architectural modest silhouettes, honoring stillness and enduring luxury.',
    image: '/images/hero_optimized.jpg',
    ctaLookbook: 'View Lookbook',
    ctaShop: 'Shop Capsule',
  },
  spotlight: [
    {
      id: 'spotlight-1',
      title: 'Abaya',
      subtitle: 'Modest Drapery',
      image: '/images/catalog/catalog-01.jpg',
      href: '/product/fina-abaya-stripe-2',
    },
    {
      id: 'spotlight-2',
      title: 'Khimar',
      subtitle: 'Silk Kaftans',
      image: '/images/catalog/catalog-04.jpg',
      href: '/shop',
    },
  ],
  missionTextiles: {
    title: 'The Future Wears What We Choose Today',
    image: '/images/catalog/catalog-06.jpg',
  },
  journal: [
    {
      id: 'journal-1',
      title: 'Rangkuman 26°Rhapsody: Menanam, Mekar, Berbuah, dan Arti Bertumbuh',
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
      image: 'https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog/uploads/1793240882095_aj89_DSCF5976.jpg',
    },
  ],
  lookbookLinks: [
    {
      id: 'vol-1',
      label: 'Vol 1: Into a New Season',
      season: "'26",
      href: '/lookbook',
      badge: 'NEW',
    },
  ],
  lookbookPage: {
    heroImage: 'https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog/uploads/1793240882095_aj89_DSCF5976.jpg',
    heroTitle: 'FLORAISON',
    heroSubtitle: 'SEVAYA • FLORAISON',
    seasonTitle: 'The Seed of The Story',
    seasonDesc:
      'Inspired by 26°C, a temperature where many tropical fruits, flowers, and plants grow at their most joyful. In Indonesia, particularly between June and August, temperatures range from 24°C to 32°C, bringing moments that feel lighter, calmer, and more balanced.',
    collagePortrait: '/images/lookbook_figma_0.png',
    collageDetail1: '/images/figma_about_1.png',
    collageDetail2: '/images/figma_about_2.png',
    panorama1: '/images/figma_hero.png',
    panorama1Title: 'Meet The Icon',
    panorama1Desc:
      'Cherry Tomato has a visible and expressive growth journey, reflecting the essence of becoming and purposeful growth.',
    panorama2: '/images/lookbook_figma_1.png',
    triptych1: '/images/lookbook_figma_2.png',
    triptych2: '/images/lookbook_figma_3.png',
    triptych3: '/images/lookbook_figma_4.png',
    triptychTitle: 'The Summer 2026 Collection',
    triptychDesc: 'Through airy textures, comforting handfeels, and a palette inspired by summer\u2019s abundance.',
    fullDress: '/images/catalog/catalog-15.jpg',
  },
  lookbookVolumesConfig: {
    'vol-1': {
      heroImage: 'https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog/uploads/1793240882095_aj89_DSCF5976.jpg',
      heroTitle: 'FLORAISON',
      heroSubtitle: 'SEVAYA • FLORAISON',
      seasonTitle: 'The Seed of The Story',
      seasonDesc:
        'Inspired by 26°C, a temperature where many tropical fruits, flowers, and plants grow at their most joyful. In Indonesia, particularly between June and August, temperatures range from 24°C to 32°C, bringing moments that feel lighter, calmer, and more balanced.',
      collagePortrait: '/images/lookbook_figma_0.png',
      collageDetail1: '/images/figma_about_1.png',
      collageDetail2: '/images/figma_about_2.png',
      panorama1: '/images/figma_hero.png',
      panorama1Title: 'Meet The Icon',
      panorama1Desc:
        'Cherry Tomato has a visible and expressive growth journey, reflecting the essence of becoming and purposeful growth.',
      panorama2: '/images/lookbook_figma_1.png',
      triptych1: '/images/lookbook_figma_2.png',
      triptych2: '/images/lookbook_figma_3.png',
      triptych3: '/images/lookbook_figma_4.png',
      triptychTitle: 'The Summer 2026 Collection',
      triptychDesc: 'Through airy textures, comforting handfeels, and a palette inspired by summer\u2019s abundance.',
      fullDress: '/images/catalog/catalog-15.jpg',
    },
  },
  conscious: {
    heroImage: '/images/catalog/catalog-06.jpg',
    bembergImage: '/images/catalog/catalog-06.jpg',
    tencelImage: '/images/catalog/catalog-16.jpg',
    linenImage: '/images/catalog/catalog-15.jpg',
    modalImage: '/images/catalog/catalog-04.jpg',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Cache
// ─────────────────────────────────────────────────────────────────────────────
const LOCAL_STORAGE_KEY = 'sevaya_site_sections';

function sanitizeHeroImage(img?: string | null): string {
  if (!img) return DEFAULT_SITE_SECTIONS.hero.image;
  const trimmed = img.trim();
  if (
    !trimmed ||
    trimmed === 'undefined' ||
    trimmed === 'null' ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return DEFAULT_SITE_SECTIONS.hero.image;
  }
  return trimmed;
}

let _cachedSiteSections: SiteSectionsConfig | null = null;
let _cachedSectionsTime = 0;
let _isServerFetched = false;
const SECTIONS_CACHE_TTL = 30 * 1000; // 30-second in-memory cache for ultra-responsive updates

// ─────────────────────────────────────────────────────────────────────────────
// getCachedSiteSections — synchronous, 0 network delay
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Synchronously retrieves cached site sections from memory → LocalStorage → DEFAULT.
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
        if (parsed.hero) {
          parsed.hero.image = sanitizeHeroImage(parsed.hero.image);
        }
        const merged: SiteSectionsConfig = {
          ...DEFAULT_SITE_SECTIONS,
          ...parsed,
          lookbookPage: {
            ...DEFAULT_SITE_SECTIONS.lookbookPage!,
            ...(parsed.lookbookPage || {}),
          },
          lookbookVolumesConfig: {
            ...DEFAULT_SITE_SECTIONS.lookbookVolumesConfig,
            ...(parsed.lookbookVolumesConfig || {}),
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

// ─────────────────────────────────────────────────────────────────────────────
// getSiteSections — async, server as single source of truth
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Loads sections configuration via /api/sections (server endpoint using Service Role Key).
 * Falls back to LocalStorage then DEFAULT_SITE_SECTIONS if the server is unreachable.
 */
export async function getSiteSections(forceRefresh = false): Promise<SiteSectionsConfig> {
  const now = Date.now();
  if (!forceRefresh && _cachedSiteSections && _isServerFetched && now - _cachedSectionsTime < SECTIONS_CACHE_TTL) {
    return _cachedSiteSections;
  }

  // ── Fetch from server ──────────────────────────────────────────────────────
  try {
    const res = await fetch('/api/sections', { cache: 'no-store' });
    if (res.ok) {
      const json = (await res.json()) as { success: boolean; sections?: SiteSectionsConfig };
      if (json.success && json.sections) {
        _cachedSiteSections = json.sections;
        _cachedSectionsTime = Date.now();
        _isServerFetched = true;
        // Keep localStorage in sync as an offline cache
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(json.sections));
          } catch {
            // ignore quota errors
          }
        }
        return json.sections;
      }
    }
  } catch (err) {
    console.warn('[sections] /api/sections unreachable, falling back to localStorage', err);
  }

  // ── LocalStorage fallback ──────────────────────────────────────────────────
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<SiteSectionsConfig>;
        const merged: SiteSectionsConfig = {
          ...DEFAULT_SITE_SECTIONS,
          ...parsed,
          hero: {
            ...DEFAULT_SITE_SECTIONS.hero,
            ...(parsed.hero || {}),
            image: sanitizeHeroImage(parsed.hero?.image),
          },
          lookbookPage: {
            ...DEFAULT_SITE_SECTIONS.lookbookPage!,
            ...(parsed.lookbookPage || {}),
          },
          lookbookVolumesConfig: {
            ...DEFAULT_SITE_SECTIONS.lookbookVolumesConfig,
            ...(parsed.lookbookVolumesConfig || {}),
          },
        };
        _cachedSiteSections = merged;
        _cachedSectionsTime = Date.now();
        return merged;
      }
    } catch (e) {
      console.warn('[sections] Failed to parse localStorage', e);
    }
  }

  // ── Hard default ───────────────────────────────────────────────────────────
  return DEFAULT_SITE_SECTIONS;
}

// ─────────────────────────────────────────────────────────────────────────────
// saveSiteSections — POST to /api/sections (server saves to Supabase)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Saves updated sections to the server via /api/sections (Service Role Key upload).
 * Also updates in-memory cache and LocalStorage immediately for instant UI feedback.
 */
export async function saveSiteSections(sections: SiteSectionsConfig): Promise<boolean> {
  // Instant local cache update
  _cachedSiteSections = sections;
  _cachedSectionsTime = Date.now();
  _isServerFetched = true;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sections));
    } catch {
      // ignore quota errors
    }
  }

  // Persist to server (which writes to Supabase Storage via Service Role Key)
  try {
    const res = await fetch('/api/sections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': 'sevaya-admin',
      },
      body: JSON.stringify({ sections }),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      console.warn('[sections] Save failed:', err.error ?? res.status);
    }
    return res.ok;
  } catch (err) {
    console.warn('[sections] POST /api/sections failed:', err);
    return false;
  }
}
