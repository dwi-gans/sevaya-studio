export interface Article {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  excerpt: string;
  content: string[];
  image: string;
  featured?: boolean;
}

export const ARTICLE_CATEGORIES = [
  'All Stories',
  'Philosophy & Lifestyle',
  'Exhibition & Studio',
  'Textile Innovation',
  'Design Heritage',
  'Care & Longevity',
];

export const INITIAL_ARTICLES: Article[] = [
  {
    id: '1',
    slug: 'the-art-of-fewer-better-choices',
    title: 'The Art of Fewer, Better Choices',
    category: 'Philosophy & Lifestyle',
    date: 'Oct 18, 2026',
    readTime: '4 min read',
    featured: true,
    excerpt:
      'Opting for quality over quantity means selecting timeless, durable, and responsibly made items. This approach simplifies our lives and fosters a deeper appreciation for our surroundings.',
    content: [
      'In a world dominated by rapid consumption and micro-trends, intentional dressing is an act of quiet confidence. At SEVAYA, we build garments that are meant to last—crafted with precision, premium plant-based fabrics, and architectural grace.',
      'Emphasizing longevity and responsible production resonates with a more sustainable and mindful lifestyle. When we buy fewer pieces with greater intentionality, dressing becomes an effortless ritual of self-expression.',
    ],
    image: '/images/catalog/catalog-11.jpg',
  },
  {
    id: '2',
    slug: 'pop-up-vol-1',
    title: 'POP-UP VOL.1 — Andalusia in Bloom',
    category: 'Exhibition & Studio',
    date: 'Oct 14, 2026',
    readTime: '3 min read',
    excerpt:
      'An intimate celebration of Andalusian silhouettes, modest craftsmanship, and community gatherings at our flagship studio.',
    content: [
      'Our inaugural Pop-Up Vol.1 brought together artisans, tastemakers, and modest fashion enthusiasts for an immersive sensory preview of our latest Cupro editions.',
      'Guests experienced the tactile richness of Bemberg™ fabrics up close, engaged in bespoke styling consultations, and shared stories of intentional living.',
    ],
    image: '/images/catalog/catalog-12.jpg',
  },
  {
    id: '3',
    slug: 'bemberg-cupro-silk',
    title: 'Bemberg™ Cupro Silk: The Breathing Miracle',
    category: 'Textile Innovation',
    date: 'Oct 08, 2026',
    readTime: '5 min read',
    excerpt:
      'Engineered from regenerated cotton linter, Bemberg™ delivers the fluid drape of silk with hypoallergenic, moisture-wicking breathability.',
    content: [
      'Unlike conventional synthetics, Cupro is 100% biodegradable and zero-waste in origin. It glides across the skin without static cling, remaining cool under tropical climates and modest layers.',
      'Every SEVAYA abaya made with Cupro reflects our refusal to compromise between ethereal beauty and circular sustainability.',
    ],
    image: '/images/catalog/catalog-14.jpg',
  },
  {
    id: '4',
    slug: '26-rhapsody-reflection',
    title: 'Rangkuman 26° Rhapsody: Menanam, Mekar, dan Bertumbuh',
    category: 'Creative Direction',
    date: 'Oct 05, 2026',
    readTime: '6 min read',
    excerpt:
      'Pertumbuhan bukanlah panen sekali jadi. Ini adalah kesabaran merawat akar kita, menyadari bahwa setiap diri bertumbuh dengan caranya masing-masing.',
    content: [
      'Koleksi 26° Rhapsody terinspirasi dari perubahan musim di Andalusia. Ketika tanah tandus menyerap embun pagi, memunculkan kuncup-kuncup bunga pertama yang bermekaran tanpa terburu-buru.',
      'Melalui potongan siluet yang mengalir bebas, kami mengundang Anda untuk merayakan fase diri yang tenang dan damai.',
    ],
    image: '/images/catalog/catalog-06.jpg',
  },
  {
    id: '5',
    slug: 'architectural-silhouettes',
    title: 'The Architecture of Sevilla & Granada in Modern Cut',
    category: 'Design Heritage',
    date: 'Sep 28, 2026',
    readTime: '4 min read',
    excerpt:
      'How the geometric archways, tranquil courtyards, and warm terracotta of Southern Spain guide our pattern drafting.',
    content: [
      'The quiet arches of the Alhambra and the sunlit stone of the Alcázar of Seville have taught us that true majesty lies in balanced proportions, not excessive ornamentation.',
      'We channel this architectural stillness into every sleeve taper, raglan drape, and discreet button placement.',
    ],
    image: '/images/catalog/catalog-08.jpg',
  },
  {
    id: '6',
    slug: 'garment-care-guide',
    title: 'Care Guide: Preserving Cupro & Fine Linens for Generations',
    category: 'Care & Longevity',
    date: 'Sep 20, 2026',
    readTime: '3 min read',
    excerpt:
      'Essential tips for hand-washing, steam care, and gentle storage to keep your heirloom modest pieces radiant for years.',
    content: [
      'Regenerated plant fibers love gentle care. Always wash in cold water with pH-neutral detergent, avoid harsh wringing, and air-dry in the shade.',
      'A light handheld steamer instantly revives Cupro to its liquid luster without damaging fine fabric weaves.',
    ],
    image: '/images/catalog/catalog-10.jpg',
  },
];

const STORAGE_KEY = 'sevaya_news_articles';

export function loadArticles(): Article[] {
  if (typeof window === 'undefined') return INITIAL_ARTICLES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ARTICLES));
      return INITIAL_ARTICLES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_ARTICLES;
  } catch {
    return INITIAL_ARTICLES;
  }
}

export function saveArticles(articles: Article[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
  } catch {
    // ignore
  }
}
