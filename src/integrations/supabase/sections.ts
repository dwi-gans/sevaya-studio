// No direct Supabase client usage here — all reads/writes go through /api/sections
// which uses the Service Role Key on the server side.

export interface HeroSectionData {
  badge: string;
  title: string;
  desc: string;
  image: string;
  mobileImage?: string;
  position?: string;
  mobilePosition?: string;
  ctaLookbook: string;
  ctaShop: string;
}

export interface SpotlightItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  position?: string;
  href: string;
}

export interface JournalArticleData {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  image: string;
  href?: string;
}

export interface HomeNarrativeConfig {
  // 1. Elegance in Simplicity
  eleganceTitle?: string;
  eleganceParagraph?: string;
  eleganceHighlight?: string;
  eleganceLinkText?: string;
  eleganceLinkUrl?: string;

  // 2. Video Player Showcase
  videoSrc?: string;
  videoPoster?: string;

  // 3. Brand Pillars (Our Core Values)
  pillarsTagline?: string;
  pillarsTitle?: string;
  pillar1Title?: string;
  pillar1Desc?: string;
  pillar2Title?: string;
  pillar2Desc?: string;
  pillar3Title?: string;
  pillar3Desc?: string;

  // 4. About SEVAYA
  aboutTagline?: string;
  aboutTitle?: string;
  aboutDesc?: string;
  aboutLinkText?: string;
  aboutLinkUrl?: string;
  aboutImage?: string;
  aboutImage1?: string;
  aboutImage2?: string;
  aboutPosition?: string;
  aboutPosition2?: string;
}

export interface HomeJournalHeaderConfig {
  manifestoTag?: string;
  manifestoTitle?: string;
  manifestoDesc?: string;
  journalBadge?: string;
  journalTitle?: string;
  journalLinkText?: string;
  journalLinkUrl?: string;
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
  hidden?: boolean;
}

export interface LookbookPageConfig {
  hidden?: boolean;
  heroImage: string;
  heroTitle: string;
  heroSubtitle: string;
  seasonTitle: string;
  seasonDesc: string;
  purpose1Title?: string;
  purpose1Desc?: string;
  purpose2Title?: string;
  purpose2Desc?: string;
  purpose3Title?: string;
  purpose3Desc?: string;
  purposePoints?: Array<{ title: string; desc: string }>;
  collagePortrait: string;
  collageDetail1: string;
  collageDetail2?: string;
  panorama1: string;
  panorama1Title: string;
  panorama1Desc: string;
  panorama2?: string;
  triptych1: string;
  triptych2: string;
  triptych3: string;
  triptychTitle: string;
  triptychDesc: string;
  triptychTagline?: string;
  fullDress: string;
  shopTag?: string;
  shopTitle?: string;
  shopDesc?: string;
  shopProductIds?: string[];
}

export interface ConsciousPageConfig {
  // Images
  heroImage?: string;
  inspoImage?: string;
  founderImage?: string;
  bembergImage?: string;
  tencelImage?: string;
  linenImage?: string;
  modalImage?: string;
  // Section 1: About SEVAYA
  aboutBadge?: string;
  aboutTitle?: string;
  aboutP?: string;
  // Philosophy block
  philoBadge?: string;
  philo1?: string;
  philo2?: string;
  philoQuote?: string;
  // Pillars divider
  pillars?: string;
  // Section 2: Inspiration
  inspoBadge?: string;
  inspoTitle?: string;
  inspoP1?: string;
  inspoP2?: string;
  inspoP3?: string;
  inspoTagline?: string;
  // Section 3: Founder's Story
  founderBadge?: string;
  founderTitle?: string;
  founderP1?: string;
  founderP2?: string;
  founderP3?: string;
  founderClosing?: string;
}

export const DEFAULT_CONSCIOUS_PAGE: ConsciousPageConfig = {
  heroImage:
    'https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog/uploads/1793240874572_wjrb_DSCF5935.jpg',
  inspoImage: '/images/figma_about_2.png',
  founderImage:
    'https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog/uploads/1793240862805_o7cy_DSCF6074.jpg',
  bembergImage: '/images/catalog/catalog-06.jpg',
  tencelImage: '/images/catalog/catalog-16.jpg',
  linenImage: '/images/catalog/catalog-15.jpg',
  modalImage: '/images/catalog/catalog-04.jpg',
  aboutBadge: 'ABOUT SEVAYA',
  aboutTitle: 'A Softer Way of Dressing.',
  aboutP:
    'SEVAYA was born from a love for timeless design, the beauty of modest dressing, and the belief that what we wear can be both beautiful and meaningful. Inspired by the architectural heritage of Andalusia, particularly the enduring beauty of Sevilla and Granada, SEVAYA brings together understated elegance, thoughtful details, and a sense of quiet simplicity.',
  philoBadge: 'OUR PHILOSOPHY',
  philo1:
    'We believe modesty is not about making yourself smaller. It is about dressing in a way that feels true to your values while making space for everything you aspire to be. Whether you are leading a team, creating something new, building a career, spending time with loved ones, or simply finding your own rhythm in everyday life, what you wear should support you through it all.',
  philo2:
    'At SEVAYA, we design with this in mind: graceful silhouettes, thoughtful details, and comfort that allows you to move freely through your day. Pieces that respect your commitment to modesty without asking you to compromise on personal style, comfort, or ambition.',
  philoQuote:
    'Because being a modest woman does not mean choosing between your faith and your aspirations. You can honour both, beautifully.',
  pillars: 'TIMELESS · INTENTIONAL · EFFORTLESS',
  inspoBadge: 'OUR INSPIRATION',
  inspoTitle: 'Inspired by Andalusia. Made for the Woman You Are Becoming.',
  inspoP1:
    'There is something timeless about Andalusia. The warmth of its architecture, the rhythm of its courtyards, the intricate patterns of its tiles, and the quiet beauty found in the simplest details.',
  inspoP2:
    'Inspired by Sevilla and Granada, our aesthetic draws from warm Mediterranean tones, graceful forms, and a deep appreciation for thoughtful design. With a background in architecture, we see clothing much like the spaces we inhabit: every proportion, detail, and material has a purpose.',
  inspoP3:
    'We translate this inspiration into modestwear for contemporary women, pieces that feel timeless yet relevant, elegant yet effortless, and beautiful without sacrificing the ease of everyday life.',
  inspoTagline: 'Rooted in heritage. Designed for the life ahead.',
  founderBadge: "THE FOUNDER'S STORY",
  founderTitle: 'A Personal Journey, Woven into Every Piece.',
  founderP1:
    'My years living in Spain shaped the way I see design. I learned to appreciate not only the beauty of architecture, but also the culture, rituals, and everyday experiences that give meaning to the things we create. With a background in architecture and design, I have always believed that good design should be thoughtful, purposeful, and made to serve the people who experience it.',
  founderP2:
    'SEVAYA grew from that belief, alongside my own personal journey toward dressing more intentionally and deepening my understanding of modesty. I wanted to create clothing that reflected my love for design while supporting the woman I aspire to become: a woman who can pursue her ambitions, embrace her individuality, and remain grounded in her faith.',
  founderP3:
    'SEVAYA is still growing, learning, and discovering better ways to create. We are committed to making more thoughtful choices in our materials, our production, and the way we approach fashion. Every piece is part of that ongoing journey.',
  founderClosing: 'Thank you for being here, and for growing with us.',
};

export interface CloserLookData {
  eyebrow?: string;
  title?: string;
  paragraph1?: string;
  paragraph2?: string;
  image?: string;
  linkText?: string;
  linkUrl?: string;
}

export interface SiteSectionsConfig {
  hero: HeroSectionData;
  closerLook?: CloserLookData;
  spotlightIntro?: string;
  spotlight: SpotlightItem[];
  narrative?: HomeNarrativeConfig;
  journalHeader?: HomeJournalHeaderConfig;
  missionTextiles: {
    title: string;
    image: string;
  };
  journal: JournalArticleData[];
  lookbook: LookbookChapterData[];
  lookbookLinks?: LookbookLinkItem[];
  lookbookPage?: LookbookPageConfig;
  lookbookVolumesConfig?: Record<string, LookbookPageConfig>;
  consciousPage?: ConsciousPageConfig;
  /** @deprecated use consciousPage instead */
  conscious?: {
    heroImage: string;
    bembergImage: string;
    tencelImage: string;
    linenImage: string;
    modalImage: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT — synchronized with actual Supabase / Admin state (Sevilla Abaya)
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_LOOKBOOK_CONFIG: LookbookPageConfig = {
  heroSubtitle: 'SEVAYA • SEVILLA',
  heroTitle: 'SEVILLA ABAYA',
  seasonDesc:
    "Sevilla Abaya An everyday expression of quiet elegance. Meet the Sevilla Abaya, our signature piece inspired by the timeless beauty of Andalusia. Designed with a graceful, flowing silhouette, Sevilla brings together a soft drape, thoughtful details, and a versatile design that feels equally at home in your everyday routine and special moments. Made from a blend of 60% cupro and 40% viscose, the fabric offers a silky-soft touch and fluid movement, creating a look that feels polished without trying too hard. Because elegance doesn't have to be complicated.",
  heroImage:
    'https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog/uploads/1793240882095_aj89_DSCF5976.jpg',

  seasonTitle: 'The Seed of The Story',
  purpose1Title: 'Two looks in one',
  purpose1Desc:
    'A beautiful abstract button detail lets you style your abaya in two different ways, giving you more versatility in one piece.',
  purpose2Title: '40 cm front zipper',
  purpose2Desc:
    'Designed for extra convenience, making everyday activities and mealtimes easier.',
  purpose3Title: 'Two side pockets',
  purpose3Desc:
    'Functional pockets on both the right and left sides, perfect for keeping your essentials close at hand.',
  purposePoints: [
    {
      title: 'Two looks in one',
      desc: 'A beautiful abstract button detail lets you style your abaya in two different ways, giving you more versatility in one piece.',
    },
    {
      title: '40 cm front zipper',
      desc: 'Designed for extra convenience, making everyday activities and mealtimes easier.',
    },
    {
      title: 'Two side pockets',
      desc: 'Functional pockets on both the right and left sides, perfect for keeping your essentials close at hand.',
    },
  ],

  collagePortrait: '/images/lookbook_figma_0.png',
  collageDetail1: '/images/figma_about_1.png',

  panorama1Title: 'Fabric Story',
  panorama1Desc:
    'A Fabric Chosen for Its Feel. 60% Cupro · 40% Viscose A thoughtful blend selected for its silky touch, soft feel, and fluid drape. Cupro is a regenerated cellulose fibre made from cotton linter, a material left over from cotton processing. Viscose is also a regenerated cellulose fibre, commonly made from wood pulp or other cellulose sources. Together, they create a fabric with an elegant fall and a smooth, refined appearance—bringing ease and understated sophistication to everyday dressing. We believe the fabric is an essential part of the experience: not only how a garment looks, but how it moves and feels when you wear it.',
  panorama1: '/images/figma_hero.png',

  triptychTitle: 'The Seed of The Story',
  triptychDesc:
    '• A graceful, flowing silhouette • Soft-touch fabric with an elegant drape • Hidden side pockets for everyday convenience • Front zipper for ease of wear • Abstract button detail at the sleeve • Designed for versatile modest styling\n\nFabric composition: 60% Cupro, 40% Viscose\nCare: Follow the garment\'s care label to maintain its texture, shape, and appearance.',
  triptychTagline: 'SEVAYA — Slow fashion, thoughtfully made.',

  triptych1: '/images/lookbook_figma_2.png',
  triptych2: '/images/lookbook_figma_3.png',
  triptych3: '/images/lookbook_figma_4.png',

  fullDress: '/images/catalog/catalog-15.jpg',

  shopTag: 'SHOP THE COLLECTION',
  shopTitle: 'SEVILLA ABAYA',
  shopDesc:
    'Siluet bernapas dan palet warna alami yang dirancang untuk menemani setiap langkah dalam ritme Anda sendiri.',
  shopProductIds: [],
};

export const DEFAULT_HOME_NARRATIVE: HomeNarrativeConfig = {
  eleganceTitle: 'Elegance in Simplicity',
  eleganceParagraph:
    'Opting for quality over quantity means selecting timeless, durable, and responsibly made items. This approach simplifies our lives and fosters a deeper appreciation for our surroundings. Emphasizing longevity and responsible production resonates with a more sustainable and mindful lifestyle.',
  eleganceHighlight: 'The Art of Fewer, Better Choices',
  eleganceLinkText: 'Read more',
  eleganceLinkUrl: '/conscious',

  videoSrc: '/videos/kani.mp4',
  videoPoster: '/images/kani_poster.webp',

  pillarsTagline: 'OUR CORE VALUES',
  pillarsTitle: 'Brand Pillars',
  pillar1Title: 'Timeless',
  pillar1Desc:
    "Designed beyond fleeting trends, with silhouettes and colours you'll want to wear season after season.",
  pillar2Title: 'Intentional',
  pillar2Desc:
    'From fabric selection to details, every decision creates meaning.',
  pillar3Title: 'Effortless',
  pillar3Desc:
    'Modest silhouettes made for ease, comfort, and quiet confidence.',

  aboutTagline: 'ABOUT SEVAYA',
  aboutTitle: 'About SEVAYA',
  aboutDesc:
    'Rooted in simplicity, SEVAYA redefines modern modestwear through understated silhouettes, responsible material selection, and intentional craftsmanship. Each piece is designed to be lived in, moving with quiet grace through every chapter of your day.',
  aboutLinkText: 'Our Story',
  aboutLinkUrl: '/conscious',
  aboutImage: '/images/figma_about_1.webp',
  aboutImage1: '/images/figma_about_1.webp',
  aboutImage2: '/images/figma_about_2.webp',
};

export const DEFAULT_JOURNAL_HEADER: HomeJournalHeaderConfig = {
  manifestoTag: 'Philosophy • Studio Manifesto',
  manifestoTitle: 'The Art of Fewer, Better Choices',
  manifestoDesc:
    'Opting for quality over quantity means selecting timeless, durable, and responsibly made items. This approach simplifies our lives and fosters a deeper appreciation for our surroundings. Emphasizing longevity and responsible production resonates with a more sustainable and mindful lifestyle.',
  journalBadge: 'EDITORIAL JOURNAL',
  journalTitle: 'OUR READING CORNER',
  journalLinkText: 'Explore All Stories',
  journalLinkUrl: '/news',
};

export const DEFAULT_CLOSER_LOOK: CloserLookData = {
  eyebrow: 'A CLOSER LOOK AT',
  title: 'VOL 1: SEVILLA ABAYA',
  paragraph1:
    'In Indonesia, particularly between June and August, temperatures range from 24°C to 32°C, bringing moments that feel lighter, calmer, and more balanced. In this atmosphere, life moves in its own rhythm; like a Rhapsody: free-flowing, expressive, and quietly harmonious.',
  paragraph2:
    'Through Vol. 1: Sevilla Abaya, SEVAYA reflects on gentle, mindful growth. That much like nature, we each unfold in our own time and beauty reveals itself when we learn to move with our own rhythm.',
  image: '/images/lookbook_figma_0.png',
  linkText: 'Discover Vol 1',
  linkUrl: '/lookbook',
};

export const DEFAULT_SITE_SECTIONS: SiteSectionsConfig = {
  hero: {
    badge: 'TIMELESS • INTENTIONAL • EFFORTLESS',
    title: 'SEVAYA',
    desc: 'An exploration of architectural modest silhouettes, honoring stillness and enduring luxury.',
    image: '/images/hero_optimized.webp',
    mobileImage: '',
    position: 'center',
    mobilePosition: 'center',
    ctaLookbook: 'Lookbook',
    ctaShop: 'Shop The Collection',
  },
  closerLook: DEFAULT_CLOSER_LOOK,
  spotlightIntro:
    'Discover modestwear designed for women who embrace their faith, pursue their ambitions, and move through life with confidence. Timeless design, effortless comfort, and thoughtful details for a life of purpose.',
  spotlight: [
    {
      id: 'spotlight-1',
      title: 'Abaya',
      subtitle: 'Modest Drapery',
      image: '/images/catalog/catalog-01.jpg',
      position: 'center',
      href: '/product/fina-abaya-stripe-2',
    },
    {
      id: 'spotlight-2',
      title: 'Khimar',
      subtitle: 'Silk Kaftans',
      image: '/images/catalog/catalog-04.jpg',
      position: 'center',
      href: '/shop',
    },
  ],
  narrative: DEFAULT_HOME_NARRATIVE,
  journalHeader: DEFAULT_JOURNAL_HEADER,
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
      href: '/news',
    },
    {
      id: 'journal-2',
      title: 'Saatnya Membuka Lembaran Baru dan Merayakan Hal-Hal Sederhana',
      date: '26 Sep 2026 • Refleksi',
      excerpt:
        'Belajar merangkul transformasi kecil dan hening dalam kehidupan modest masa kini dengan siluet sejuk dan bernapas alami...',
      image: '/images/catalog/catalog-12.jpg',
      href: '/news',
    },
  ],
  lookbook: [
    {
      id: 'ch-1',
      num: 'BAB 1',
      title: 'Sevilla Abaya // Lookbook',
      image:
        'https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog/uploads/1793240882095_aj89_DSCF5976.jpg',
    },
  ],
  lookbookLinks: [
    {
      id: 'vol-1',
      label: 'Vol 1: Sevilla Abaya',
      season: "'26",
      href: '/lookbook',
      badge: 'NEW',
    },
  ],
  lookbookPage: DEFAULT_LOOKBOOK_CONFIG,
  lookbookVolumesConfig: {
    'vol-1': DEFAULT_LOOKBOOK_CONFIG,
  },
  consciousPage: DEFAULT_CONSCIOUS_PAGE,
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
    trimmed.startsWith('blob:')
  ) {
    return DEFAULT_SITE_SECTIONS.hero.image;
  }
  return trimmed;
}

let _cachedSiteSections: SiteSectionsConfig | null = null;
let _cachedSectionsTime = 0;
let _isServerFetched = false;
const SECTIONS_CACHE_TTL = 30 * 1000; // 30-second in-memory cache

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
        if (
          parsed.lookbookPage?.heroTitle === 'FLORAISON' ||
          parsed.lookbookPage?.heroSubtitle === 'SEVAYA • FLORAISON'
        ) {
          parsed.lookbookPage = DEFAULT_LOOKBOOK_CONFIG;
        }
        if (
          parsed.lookbookVolumesConfig?.['vol-1']?.heroTitle === 'FLORAISON' ||
          parsed.lookbookVolumesConfig?.['vol-1']?.heroSubtitle === 'SEVAYA • FLORAISON'
        ) {
          parsed.lookbookVolumesConfig = {
            ...(parsed.lookbookVolumesConfig || {}),
            'vol-1': DEFAULT_LOOKBOOK_CONFIG,
          };
        }
        const merged: SiteSectionsConfig = {
          ...DEFAULT_SITE_SECTIONS,
          ...parsed,
          hero: {
            ...DEFAULT_SITE_SECTIONS.hero,
            ...(parsed.hero || {}),
            image: sanitizeHeroImage(parsed.hero?.image),
            position: parsed.hero?.position || DEFAULT_SITE_SECTIONS.hero.position,
            mobilePosition: parsed.hero?.mobilePosition || parsed.hero?.position || DEFAULT_SITE_SECTIONS.hero.mobilePosition,
          },
          closerLook: {
            ...DEFAULT_CLOSER_LOOK,
            ...(parsed.closerLook || {}),
          },
          narrative: {
            ...DEFAULT_HOME_NARRATIVE,
            ...(parsed.narrative || {}),
          },
          journalHeader: {
            ...DEFAULT_JOURNAL_HEADER,
            ...(parsed.journalHeader || {}),
          },
          consciousPage: {
            ...DEFAULT_CONSCIOUS_PAGE,
            ...(parsed.consciousPage || {}),
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

  const isServer = typeof window === 'undefined';

  // ── 0. Server-Side Instant Disk Read (0 ms, Zero Delay) ────────────────────
  if (isServer) {
    try {
      const dynamicRequire = eval('require');
      const fs = dynamicRequire('fs');
      const path = dynamicRequire('path');
      const diskPath = path.join(process.cwd(), '.data', 'sections.json');
      if (fs.existsSync(diskPath)) {
        const fileContent = fs.readFileSync(diskPath, 'utf-8');
        const cleanContent = fileContent.replace(/^\uFEFF/, '');
        const parsed = JSON.parse(cleanContent) as Partial<SiteSectionsConfig>;
        if (parsed && typeof parsed === 'object') {
          const merged: SiteSectionsConfig = {
            ...DEFAULT_SITE_SECTIONS,
            ...parsed,
            hero: {
              ...DEFAULT_SITE_SECTIONS.hero,
              ...(parsed.hero || {}),
              image: sanitizeHeroImage(parsed.hero?.image),
              mobileImage: parsed.hero?.mobileImage ? sanitizeHeroImage(parsed.hero?.mobileImage) : '',
              position: parsed.hero?.position || DEFAULT_SITE_SECTIONS.hero.position,
              mobilePosition: parsed.hero?.mobilePosition || parsed.hero?.position || DEFAULT_SITE_SECTIONS.hero.mobilePosition,
            },
            closerLook: {
              ...DEFAULT_CLOSER_LOOK,
              ...(parsed.closerLook || {}),
            },
            narrative: {
              ...DEFAULT_HOME_NARRATIVE,
              ...(parsed.narrative || {}),
            },
            journalHeader: {
              ...DEFAULT_JOURNAL_HEADER,
              ...(parsed.journalHeader || {}),
            },
            consciousPage: {
              ...DEFAULT_CONSCIOUS_PAGE,
              ...(parsed.consciousPage || {}),
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
          _isServerFetched = true;
          return merged;
        }
      }
    } catch {
      // Fallback ke network fetch jika filesystem tidak tersedia
    }
  }

  // ── Fetch from server or Supabase Storage CDN ──────────────────────────────
  try {
    // In Node.js / Server Components, relative URLs fail with ERR_INVALID_URL.
    // Use the public Supabase Storage CDN directly on server as the single source of truth!
    const url = isServer
      ? (forceRefresh
          ? `https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog/sections.json?t=${Date.now()}`
          : 'https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog/sections.json')
      : (forceRefresh
          ? `/api/sections?fresh=1&t=${Date.now()}`
          : '/api/sections');

    const fetchOptions: RequestInit = isServer
      ? (forceRefresh ? { cache: 'no-store' } : { next: { revalidate: 60 } })
      : (forceRefresh ? { cache: 'no-store' } : { cache: 'default' });

    const res = await fetch(url, fetchOptions);
    if (res.ok) {
      const json = await res.json();
      const rawSections = (isServer ? json : json.sections) as SiteSectionsConfig | undefined;
      if (rawSections) {
        const merged: SiteSectionsConfig = {
          ...DEFAULT_SITE_SECTIONS,
          ...rawSections,
          hero: {
            ...DEFAULT_SITE_SECTIONS.hero,
            ...(rawSections.hero || {}),
            image: sanitizeHeroImage(rawSections.hero?.image),
            mobileImage: rawSections.hero?.mobileImage ? sanitizeHeroImage(rawSections.hero?.mobileImage) : '',
            position: rawSections.hero?.position || DEFAULT_SITE_SECTIONS.hero.position,
            mobilePosition: rawSections.hero?.mobilePosition || rawSections.hero?.position || DEFAULT_SITE_SECTIONS.hero.mobilePosition,
          },
          closerLook: {
            ...DEFAULT_CLOSER_LOOK,
            ...(rawSections.closerLook || {}),
          },
          narrative: {
            ...DEFAULT_HOME_NARRATIVE,
            ...(rawSections.narrative || {}),
          },
          journalHeader: {
            ...DEFAULT_JOURNAL_HEADER,
            ...(rawSections.journalHeader || {}),
          },
          consciousPage: {
            ...DEFAULT_CONSCIOUS_PAGE,
            ...(rawSections.consciousPage || {}),
          },
          lookbookPage: {
            ...DEFAULT_SITE_SECTIONS.lookbookPage!,
            ...(rawSections.lookbookPage || {}),
          },
          lookbookVolumesConfig: {
            ...DEFAULT_SITE_SECTIONS.lookbookVolumesConfig,
            ...(rawSections.lookbookVolumesConfig || {}),
          },
        };

        _cachedSiteSections = merged;
        _cachedSectionsTime = Date.now();
        _isServerFetched = true;
        // Keep localStorage in sync as an offline cache
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
          } catch {
            // ignore quota errors
          }
        }
        return merged;
      }
    }
  } catch (err) {
    console.warn('[sections] Failed to fetch sections, falling back to cache/default', err);
  }

  // ── LocalStorage fallback ──────────────────────────────────────────────────
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<SiteSectionsConfig>;
        if (
          parsed.lookbookPage?.heroTitle === 'FLORAISON' ||
          parsed.lookbookPage?.heroSubtitle === 'SEVAYA • FLORAISON'
        ) {
          parsed.lookbookPage = DEFAULT_LOOKBOOK_CONFIG;
        }
        if (
          parsed.lookbookVolumesConfig?.['vol-1']?.heroTitle === 'FLORAISON' ||
          parsed.lookbookVolumesConfig?.['vol-1']?.heroSubtitle === 'SEVAYA • FLORAISON'
        ) {
          parsed.lookbookVolumesConfig = {
            ...(parsed.lookbookVolumesConfig || {}),
            'vol-1': DEFAULT_LOOKBOOK_CONFIG,
          };
        }
        const merged: SiteSectionsConfig = {
          ...DEFAULT_SITE_SECTIONS,
          ...parsed,
          hero: {
            ...DEFAULT_SITE_SECTIONS.hero,
            ...(parsed.hero || {}),
            image: sanitizeHeroImage(parsed.hero?.image),
            position: parsed.hero?.position || DEFAULT_SITE_SECTIONS.hero.position,
            mobilePosition: parsed.hero?.mobilePosition || parsed.hero?.position || DEFAULT_SITE_SECTIONS.hero.mobilePosition,
          },
          closerLook: {
            ...DEFAULT_CLOSER_LOOK,
            ...(parsed.closerLook || {}),
          },
          narrative: {
            ...DEFAULT_HOME_NARRATIVE,
            ...(parsed.narrative || {}),
          },
          journalHeader: {
            ...DEFAULT_JOURNAL_HEADER,
            ...(parsed.journalHeader || {}),
          },
          consciousPage: {
            ...DEFAULT_CONSCIOUS_PAGE,
            ...(parsed.consciousPage || {}),
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
      return false;
    }
    const data = await res.json().catch(() => null);
    if (data?.sections) {
      _cachedSiteSections = data.sections;
      _cachedSectionsTime = Date.now();
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.sections));
        } catch {
          // ignore
        }
      }
    }
    return true;
  } catch (err) {
    console.warn('[sections] POST /api/sections failed:', err);
    return false;
  }
}
