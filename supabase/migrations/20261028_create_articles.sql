-- Migration: Create articles table for SEVAYA news/editorial
-- Run this SQL in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS public.articles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  title       text NOT NULL,
  category    text NOT NULL DEFAULT 'Journal',
  date        text NOT NULL,
  read_time   text NOT NULL DEFAULT '3 min read',
  excerpt     text NOT NULL DEFAULT '',
  content     jsonb NOT NULL DEFAULT '[]',
  image       text NOT NULL DEFAULT '/images/catalog/catalog-01.jpg',
  images      jsonb NOT NULL DEFAULT '[]',
  featured    boolean NOT NULL DEFAULT false,
  published   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Allow public read access for published articles
CREATE POLICY "Public can read published articles"
  ON public.articles
  FOR SELECT
  USING (published = true);

-- Allow all operations via service role (server-side API routes)
CREATE POLICY "Service role full access"
  ON public.articles
  FOR ALL
  USING (auth.role() = 'service_role');

-- ── Seed Data ────────────────────────────────────────────────────────────────

INSERT INTO public.articles (slug, title, category, date, read_time, excerpt, content, image, featured, published)
VALUES (
  'the-art-of-fewer-better-choices',
  'The Art of Fewer, Better Choices',
  'Journal',
  'Oct 18, 2026',
  '4 min read',
  'Opting for quality over quantity means selecting timeless, durable, and responsibly made items.',
  jsonb_build_array(
    'In a world dominated by rapid consumption and micro-trends, intentional dressing is an act of quiet confidence. At SEVAYA, we build garments that are meant to last—crafted with precision, premium plant-based fabrics, and architectural grace.',
    'Emphasizing longevity and responsible production resonates with a more sustainable and mindful lifestyle. When we buy fewer pieces with greater intentionality, dressing becomes an effortless ritual of self-expression.'
  ),
  '/images/catalog/catalog-11.jpg',
  true,
  true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.articles (slug, title, category, date, read_time, excerpt, content, image, featured, published)
VALUES (
  'pop-up-vol-1',
  'POP-UP VOL.1 — Andalusia in Bloom',
  'Event',
  'Oct 14, 2026',
  '3 min read',
  'An intimate celebration of Andalusian silhouettes, modest craftsmanship, and community gatherings at our flagship studio.',
  jsonb_build_array(
    'Our inaugural Pop-Up Vol.1 brought together artisans, tastemakers, and modest fashion enthusiasts for an immersive sensory preview of our latest Cupro editions.',
    'Guests experienced the tactile richness of Bemberg fabrics up close, engaged in bespoke styling consultations, and shared stories of intentional living.'
  ),
  '/images/catalog/catalog-12.jpg',
  false,
  true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.articles (slug, title, category, date, read_time, excerpt, content, image, featured, published)
VALUES (
  'bemberg-cupro-silk',
  'Bemberg Cupro Silk: The Breathing Miracle',
  'Journal',
  'Oct 08, 2026',
  '5 min read',
  'Engineered from regenerated cotton linter, Bemberg delivers the fluid drape of silk with hypoallergenic, moisture-wicking breathability.',
  jsonb_build_array(
    'Unlike conventional synthetics, Cupro is 100% biodegradable and zero-waste in origin. It glides across the skin without static cling, remaining cool under tropical climates and modest layers.',
    'Every SEVAYA abaya made with Cupro reflects our refusal to compromise between ethereal beauty and circular sustainability.'
  ),
  '/images/catalog/catalog-14.jpg',
  false,
  true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.articles (slug, title, category, date, read_time, excerpt, content, image, featured, published)
VALUES (
  '26-rhapsody-reflection',
  'Rangkuman 26 Rhapsody: Menanam, Mekar, dan Bertumbuh',
  'Journal',
  'Oct 05, 2026',
  '6 min read',
  'Pertumbuhan bukanlah panen sekali jadi. Ini adalah kesabaran merawat akar kita, menyadari bahwa setiap diri bertumbuh dengan caranya masing-masing.',
  jsonb_build_array(
    'Koleksi 26 Rhapsody terinspirasi dari perubahan musim di Andalusia. Ketika tanah tandus menyerap embun pagi, memunculkan kuncup-kuncup bunga pertama yang bermekaran tanpa terburu-buru.',
    'Melalui potongan siluet yang mengalir bebas, kami mengundang Anda untuk merayakan fase diri yang tenang dan damai.'
  ),
  '/images/catalog/catalog-06.jpg',
  false,
  true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.articles (slug, title, category, date, read_time, excerpt, content, image, featured, published)
VALUES (
  'architectural-silhouettes',
  'The Architecture of Sevilla and Granada in Modern Cut',
  'Journal',
  'Sep 28, 2026',
  '4 min read',
  'How the geometric archways, tranquil courtyards, and warm terracotta of Southern Spain guide our pattern drafting.',
  jsonb_build_array(
    'The quiet arches of the Alhambra and the sunlit stone of the Alcazar of Seville have taught us that true majesty lies in balanced proportions, not excessive ornamentation.',
    'We channel this architectural stillness into every sleeve taper, raglan drape, and discreet button placement.'
  ),
  '/images/catalog/catalog-08.jpg',
  false,
  true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.articles (slug, title, category, date, read_time, excerpt, content, image, featured, published)
VALUES (
  'garment-care-guide',
  'Care Guide: Preserving Cupro and Fine Linens for Generations',
  'Journal',
  'Sep 20, 2026',
  '3 min read',
  'Essential tips for hand-washing, steam care, and gentle storage to keep your heirloom modest pieces radiant for years.',
  jsonb_build_array(
    'Regenerated plant fibers love gentle care. Always wash in cold water with pH-neutral detergent, avoid harsh wringing, and air-dry in the shade.',
    'A light handheld steamer instantly revives Cupro to its liquid luster without damaging fine fabric weaves.'
  ),
  '/images/catalog/catalog-10.jpg',
  false,
  true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.articles (slug, title, category, date, read_time, excerpt, content, image, featured, published)
VALUES (
  'private-atelier-trunk-show',
  'Private Atelier Trunk Show and Sensory Tea Gathering',
  'Event',
  'Sep 12, 2026',
  '3 min read',
  'An exclusive afternoon preview of our bespoke modest silhouettes paired with botanical tea tastings and slow fashion conversations.',
  jsonb_build_array(
    'We welcomed our closest community to an intimate salon gathering exploring fabric drape, embroidery details, and slow-crafted design philosophy.',
    'Attendees had the opportunity to personalize their abayas and discuss timeless wardrobe curation with our creative team.'
  ),
  '/images/catalog/catalog-05.jpg',
  false,
  true
) ON CONFLICT (slug) DO NOTHING;
