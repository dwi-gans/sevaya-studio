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
// DEFAULT — synchronized with actual Supabase / Admin state (Sevilla Abaya & Alma)
// ─────────────────────────────────────────────────────────────────────────────
export const DEFAULT_LOOKBOOK_CONFIG: LookbookPageConfig = {
  heroSubtitle: 'SEVAYA • SEVILLA',
  heroTitle: 'SEVILLA ABAYA',
  seasonDesc:
    "Sevilla Abaya An everyday expression of quiet elegance. Meet the Sevilla Abaya, our signature piece inspired by the timeless beauty of Andalusia. Designed with a graceful, flowing silhouette, Sevilla brings together a soft drape, thoughtful details, and a versatile design that feels equally at home in your everyday routine and special moments. Made from a blend of 60% cupro and 40% viscose, the fabric offers a silky-soft touch and fluid movement, creating a look that feels polished without trying too hard. Because elegance doesn't have to be complicated.",
  heroImage:
    'https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog/uploads/1793240882095_aj89_DSCF5976.webp',

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
  shopProductIds: ['1794063420037', '1794019430147'],
};

export const DEFAULT_LOOKBOOK_VOL2_CONFIG: LookbookPageConfig = {
  heroImage:
    'https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog/uploads/hero_floraison_mobile_1794246268248.webp',
  heroTitle: 'VOL 2: ALMA CUPRO STRIPES',
  heroSubtitle: 'SEVAYA • VOL-2',
  seasonTitle: 'The Seed of The Story',
  seasonDesc:
    'An ode to the beauty of everyday moments.\n\nMeet Alma, a piece designed to accompany you through the little moments that make life meaningful.\n\nCrafted from 60% Cupro and 40% Viscose, its silky-soft texture, lightweight feel, and naturally fluid drape bring effortless comfort to your everyday wardrobe.\n\nSubtle stripes add a quiet character, while its timeless silhouette makes getting dressed feel beautifully simple.\n\nBecause sometimes, the most beautiful moments are found in the ordinary.\n\nALMA - Find beauty in the everyday.',
  collagePortrait:
    'https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog/uploads/1794209708329_ir1a_SEVAYA_Instagram_Post__1_.webp',
  collageDetail1:
    'https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog/uploads/1794209428394_cobm_IMG_3005.webp',
  collageDetail2: '/images/figma_about_2.png',
  panorama1:
    'https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog/uploads/1794307875871_bt0z_IMG_3074.webp',
  panorama1Title: 'Fabric Story',
  panorama1Desc:
    'At the heart of ALMA is a thoughtfully selected blend of 60% Cupro 38% Viscose 2 & Polyester.\n\nCupro, a regenerated cellulose fibre derived from cotton linter, is loved for its exceptionally smooth, silky touch. Combined with viscose, it creates a fabric with a beautiful fluid drape and a naturally soft feel.\n\nThe result is a fabric that feels lightweight, breathable, and effortlessly flowy against the skin.\n\nWe believe that what we wear should feel just as beautiful as it looks. That\'s why every fabric choice is an intentional step towards creating modestwear that brings together comfort, timeless design, and a more thoughtful approach to fashion.\n\nSilky-soft. Lightweight. Naturally fluid.',
  panorama2: '/images/lookbook_figma_1.png',
  triptych1:
    'https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog/uploads/1794209346069_i67r_IMG_3007.webp',
  triptych2:
    'https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog/uploads/1794209681415_2azw_SEVAYA_Instagram_Post__3_.webp',
  triptych3:
    'https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog/uploads/1794209467724_tnjk_IMG_3004.webp',
  triptychTitle: 'A Little Care Goes a Long Way.',
  triptychDesc:
    'Made with a delicate Cupro and Viscose blend, ALMA deserves gentle care to maintain its softness, beautiful drape, and quality over time.\n\nWashing\n\nHand wash gently using cold water.\n\nUse a mild detergent.\n\nAvoid excessive rubbing or scrubbing.\n\nDrying\n\nDo not wring or twist the fabric.\n\nAvoid tumble drying.\n\nAir dry naturally in a shaded area.\n\nImportant Fabric Note\n\nDue to the natural characteristics of regenerated cellulose fibres, slight shrinkage may occur after washing. Gentle handling and proper care will help maintain the fabric\'s quality and shape.\n\nWear it often. Care for it gently. Keep it timeless.',
  fullDress:
    'https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog/uploads/1794209334840_864s_IMG_3006.webp',
  shopTag: 'SHOP THE COLLECTION',
  shopTitle: 'ALMA CUPRO STRIPES',
  shopDesc:
    'Siluet bernapas dan palet warna alami yang dirancang untuk menemani setiap langkah dalam ritme Anda sendiri.',
  shopProductIds: ['1793862893527'],
  hidden: false,
  purposePoints: [
    {
      title: 'Subtle Stripe Details',
      desc: 'A timeless stripe pattern adds a touch of character to the minimalist silhouette, creating a look that feels effortlessly elegant.',
    },
    {
      title: 'Two Functional Side Pockets',
      desc: 'Thoughtfully placed pockets on both the right and left sides, perfect for keeping your daily essentials within reach.',
    },
    {
      title: '40 cm Front Zipper',
      desc: 'Functional pockets on both the right and left sides, perfect for keeping your essentials close at hand.',
    },
    {
      title: 'Premium Cupro Viscose Fabric',
      desc: 'Crafted from a premium blend of Cupro and Viscose, offering a silky-soft touch, lightweight feel, breathable comfort, and a naturally fluid drape.',
    },
  ],
  purpose1Title: 'Subtle Stripe Details',
  purpose1Desc:
    'A timeless stripe pattern adds a touch of character to the minimalist silhouette, creating a look that feels effortlessly elegant.',
  purpose2Title: 'Two Functional Side Pockets',
  purpose2Desc:
    'Thoughtfully placed pockets on both the right and left sides, perfect for keeping your daily essentials within reach.',
  purpose3Title: '40 cm Front Zipper',
  purpose3Desc:
    'Functional pockets on both the right and left sides, perfect for keeping your essentials close at hand.',
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
  title: 'VOL 2: ALMA',
  paragraph1:
    'An ode to the beauty of everyday moments.\n\nMeet Alma, a piece designed to accompany you through the little moments that make life meaningful.\n\nCrafted from 60% Cupro and 40% Viscose, its silky-soft texture, lightweight feel, and naturally fluid drape bring effortless comfort to your everyday wardrobe.\n\nSubtle stripes add a quiet character, while its timeless silhouette makes getting dressed feel beautifully simple.\n\nBecause sometimes, the most beautiful moments are found in the ordinary.\n\nALMA - Find beauty in the everyday.',
  paragraph2:
    "We believe that what we wear should feel just as beautiful as it looks. That's why every fabric choice is an intentional step towards creating modestwear that brings together comfort, timeless design, and a more thoughtful approach to fashion.",
  image:
    'https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog/uploads/1794021316191_9y0f_SEVAYA_Instagram_Post.webp',
  linkText: 'Discover Vol 2',
  linkUrl: '/lookbook/vol-2',
};
export const DEFAULT_LOOKBOOK_LINKS: LookbookLinkItem[] = [
  {
    id: 'vol-1',
    label: 'Vol 1: Sevilla Abaya',
    season: "'26",
    href: '/lookbook',
    badge: 'NEW',
  },
  {
    id: 'vol-2',
    label: 'Vol 2: Alma',
    season: "'26",
    href: '/lookbook/vol-2',
    badge: 'NEW',
  },
];

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
      title: 'POP-UP VOL.1 - Andalusia in Bloom',
      date: 'September 9-10, 2026 • Event',
      excerpt:
        'Some stories begin with a place, and some places stay with us long after we leave. For our founder, that place was Spain...',
      image:
        'https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog/uploads/1793240875994_5q50_DSCF5960.webp',
      href: '/news/sevaya-hadir-dengan-booth-abaya-di-event-wtp',
    },
    {
      id: 'journal-2',
      title: 'A Journey Toward More Thoughtful Fashion',
      date: 'Oct 18, 2026 • Journal',
      excerpt:
        'Our journey began with a simple thought: fashion does not always have to move faster to be meaningful...',
      image: '/images/catalog/catalog-11.jpg',
      href: '/news/the-art-of-fewer-better-choices',
    },
    {
      id: 'journal-3',
      title: 'Beyond What We Wear',
      date: 'September 1, 2026 • Journal',
      excerpt:
        'We believe that what we receive is never entirely ours. Every provision is a blessing from Allah...',
      image:
        'https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog/uploads/1794243371694_rwql_SEVAYA_Instagram_Post_-_3.webp',
      href: '/news/beyond-what-we-wear',
    },
  ],
  lookbook: [
    {
      id: 'ch-1',
      num: 'BAB 1',
      title: 'Sevilla Abaya // Lookbook',
      image:
        'https://vhoifosfdzcmtczizzrb.supabase.co/storage/v1/object/public/catalog/uploads/1793240882095_aj89_DSCF5976.webp',
    },
  ],
  lookbookLinks: DEFAULT_LOOKBOOK_LINKS,
  lookbookPage: DEFAULT_LOOKBOOK_CONFIG,
  lookbookVolumesConfig: {
    'vol-1': DEFAULT_LOOKBOOK_CONFIG,
    'vol-2': DEFAULT_LOOKBOOK_VOL2_CONFIG,
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
// Normalization & Deep Merger
// ─────────────────────────────────────────────────────────────────────────────
export function normalizeAndMergeSiteSections(
  incoming?: Partial<SiteSectionsConfig> | null
): SiteSectionsConfig {
  if (!incoming || typeof incoming !== 'object') {
    return DEFAULT_SITE_SECTIONS;
  }

  // Sanitize Floraison legacy artifact if any
  let lookbookPage = incoming.lookbookPage;
  if (
    lookbookPage?.heroTitle === 'FLORAISON' ||
    lookbookPage?.heroSubtitle === 'SEVAYA • FLORAISON'
  ) {
    lookbookPage = DEFAULT_LOOKBOOK_CONFIG;
  }

  const lookbookVolumesConfig: Record<string, LookbookPageConfig> = {
    ...DEFAULT_SITE_SECTIONS.lookbookVolumesConfig,
    ...(incoming.lookbookVolumesConfig || {}),
  };

  if (
    lookbookVolumesConfig['vol-1']?.heroTitle === 'FLORAISON' ||
    lookbookVolumesConfig['vol-1']?.heroSubtitle === 'SEVAYA • FLORAISON'
  ) {
    lookbookVolumesConfig['vol-1'] = DEFAULT_LOOKBOOK_CONFIG;
  }

  if (!lookbookVolumesConfig['vol-2']) {
    lookbookVolumesConfig['vol-2'] = DEFAULT_LOOKBOOK_VOL2_CONFIG;
  }

  // Ensure lookbookLinks always includes both vol-1 and vol-2
  let lookbookLinks =
    Array.isArray(incoming.lookbookLinks) && incoming.lookbookLinks.length > 0
      ? [...incoming.lookbookLinks]
      : [...DEFAULT_LOOKBOOK_LINKS];

  const vol1Link = DEFAULT_LOOKBOOK_LINKS[0];
  const vol2Link = DEFAULT_LOOKBOOK_LINKS[1];

  if (vol1Link && !lookbookLinks.some((l) => l.id === 'vol-1' || l.href === '/lookbook')) {
    lookbookLinks.unshift(vol1Link);
  }
  if (vol2Link && !lookbookLinks.some((l) => l.id === 'vol-2' || l.href.includes('vol-2'))) {
    lookbookLinks.push(vol2Link);
  }

  const merged: SiteSectionsConfig = {
    ...DEFAULT_SITE_SECTIONS,
    ...incoming,
    hero: {
      ...DEFAULT_SITE_SECTIONS.hero,
      ...(incoming.hero || {}),
      image: sanitizeHeroImage(incoming.hero?.image),
      mobileImage: incoming.hero?.mobileImage ? sanitizeHeroImage(incoming.hero?.mobileImage) : '',
      position: incoming.hero?.position || DEFAULT_SITE_SECTIONS.hero.position,
      mobilePosition:
        incoming.hero?.mobilePosition ||
        incoming.hero?.position ||
        DEFAULT_SITE_SECTIONS.hero.mobilePosition,
    },
    closerLook: {
      ...DEFAULT_CLOSER_LOOK,
      ...(incoming.closerLook || {}),
    },
    narrative: {
      ...DEFAULT_HOME_NARRATIVE,
      ...(incoming.narrative || {}),
    },
    journalHeader: {
      ...DEFAULT_JOURNAL_HEADER,
      ...(incoming.journalHeader || {}),
    },
    consciousPage: {
      ...DEFAULT_CONSCIOUS_PAGE,
      ...(incoming.consciousPage || {}),
    },
    lookbookPage: {
      ...(DEFAULT_SITE_SECTIONS.lookbookPage || DEFAULT_LOOKBOOK_CONFIG),
      ...(lookbookPage || {}),
    },
    lookbookLinks,
    lookbookVolumesConfig,
  };

  return deepCleanMojibake(merged);
}

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
        const cleanMerged = normalizeAndMergeSiteSections(parsed);
        _cachedSiteSections = cleanMerged;
        _cachedSectionsTime = Date.now();
        return cleanMerged;
      }
    } catch (e) {
      console.warn('Failed to parse site sections from localStorage', e);
    }
  }
  return DEFAULT_SITE_SECTIONS;
}

/**
 * Sanitizes mojibake characters resulting from mis-encoded UTF-8 / Windows-1252 strings.
 * e.g. â€¢ -> •, â€” -> —, Â· -> ·, etc.
 */
export function cleanMojibake(text: string): string {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/â€¢/g, '•')
    .replace(/â€”/g, '—')
    .replace(/â€“/g, '–')
    .replace(/â€œ/g, '“')
    .replace(/â€/g, '”')
    .replace(/â€˜/g, '‘')
    .replace(/â€™/g, '’')
    .replace(/Â·/g, '·')
    .replace(/âœ“/g, '✓')
    .replace(/â”€/g, '─')
    .replace(/â•/g, '═')
    .replace(/Â /g, ' ');
}

export function deepCleanMojibake<T>(obj: T): T {
  if (typeof obj === 'string') {
    return cleanMojibake(obj) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(deepCleanMojibake) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      cleaned[key] = deepCleanMojibake(val);
    }
    return cleaned as T;
  }
  return obj;
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
          const cleanMerged = normalizeAndMergeSiteSections(parsed);
          _cachedSiteSections = cleanMerged;
          _cachedSectionsTime = Date.now();
          _isServerFetched = true;
          return cleanMerged;
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
        const cleanMerged = normalizeAndMergeSiteSections(rawSections);
        _cachedSiteSections = cleanMerged;
        _cachedSectionsTime = Date.now();
        _isServerFetched = true;
        // Keep localStorage in sync as an offline cache
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleanMerged));
          } catch {
            // ignore quota errors
          }
        }
        return cleanMerged;
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
        const cleanMerged = normalizeAndMergeSiteSections(parsed);
        _cachedSiteSections = cleanMerged;
        _cachedSectionsTime = Date.now();
        return cleanMerged;
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
  const cleanSections = deepCleanMojibake(sections);
  // Instant local cache update
  _cachedSiteSections = cleanSections;
  _cachedSectionsTime = Date.now();
  _isServerFetched = true;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleanSections));
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
      body: JSON.stringify({ sections: cleanSections }),
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
