import { supabase } from './client';
import { INITIAL_ARTICLES } from '@/data/newsArticles';

export interface Article {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  read_time: string;
  excerpt: string;
  content: string[];
  image: string;           // cover / thumbnail utama
  hero_caption?: string;   // keterangan / caption foto sampul (hero)
  images: string[];        // foto-foto isi artikel (bisa lebih dari 1)
  image_captions?: string[]; // keterangan / penjelasan tiap foto
  featured: boolean;
  published: boolean;
  created_at?: string;
  updated_at?: string;
}

export type ArticleInsert = Omit<Article, 'id' | 'created_at' | 'updated_at'>;
export type ArticleUpdate = Partial<ArticleInsert>;

export const ARTICLE_CATEGORIES = ['All Stories', 'Journal', 'Event'];

// ── READ ─────────────────────────────────────────────────────────────────────

async function loadCaptionsRegistrySafe() {
  if (typeof window === 'undefined') {
    try {
      const { getAllArticleCaptions } = await import('@/lib/article-captions');
      return await getAllArticleCaptions();
    } catch {
      return {};
    }
  }
  return {};
}

async function saveCaptionsSafe(
  id: string | undefined,
  slug: string | undefined,
  captions: { hero_caption?: string; image_captions?: string[] }
) {
  if (typeof window === 'undefined') {
    try {
      const { saveCaptionsForArticle } = await import('@/lib/article-captions');
      await saveCaptionsForArticle(id, slug, captions);
    } catch (err) {
      console.error('[articles] saveCaptionsSafe error:', err);
    }
  }
}

async function deleteCaptionsSafe(idOrSlug: string) {
  if (typeof window === 'undefined') {
    try {
      const { deleteCaptionsForArticle } = await import('@/lib/article-captions');
      await deleteCaptionsForArticle(idOrSlug);
    } catch (err) {
      console.error('[articles] deleteCaptionsSafe error:', err);
    }
  }
}

function getFallbackInitialArticles(): Article[] {
  return INITIAL_ARTICLES.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    category: a.category,
    date: a.date,
    read_time: a.readTime,
    excerpt: a.excerpt,
    content: a.content,
    image: a.image,
    images: ['/images/catalog/catalog-12.jpg'],
    featured: Boolean(a.featured),
    published: true,
  }));
}

export async function getArticles(): Promise<Article[]> {
  const [dbRes, captionsMap] = await Promise.all([
    supabase
      .from('articles')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false }),
    loadCaptionsRegistrySafe(),
  ]);

  const { data, error } = dbRes;
  if (error) {
    console.warn('[articles] getArticles error:', error.message);
    return [];
  }
  if (!data || data.length === 0) return [];
  return data.map((item) => normalizeArticle(item, captionsMap));
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const [dbRes, captionsMap] = await Promise.all([
    supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .maybeSingle(),
    loadCaptionsRegistrySafe(),
  ]);

  const { data, error } = dbRes;
  if (!error && data) {
    return normalizeArticle(data, captionsMap);
  }

  // Article not found in DB → return null (do NOT fallback to hardcoded data)
  if (error) {
    console.warn('[articles] getArticleBySlug error:', error.message);
  }
  return null;
}

export async function getAllArticlesAdmin(): Promise<Article[]> {
  const [dbRes, captionsMap] = await Promise.all([
    supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false }),
    loadCaptionsRegistrySafe(),
  ]);

  const { data, error } = dbRes;
  if (error) {
    console.warn('[articles] getAllArticlesAdmin error:', error.message);
    return [];
  }
  if (!data || data.length === 0) return [];
  return data.map((item) => normalizeArticle(item, captionsMap));
}

// ── CREATE ────────────────────────────────────────────────────────────────────

function cleanPayloadForDb<T extends Record<string, any>>(payload: T, errMessage?: string): Partial<T> {
  const cleaned: Record<string, any> = { ...payload };
  const match = errMessage?.match(/Could not find the '([^']+)' column/i);
  if (match && match[1]) {
    delete cleaned[match[1]];
  }
  delete cleaned.hero_caption;
  delete cleaned.image_captions;
  return cleaned as Partial<T>;
}

export async function createArticle(article: ArticleInsert): Promise<Article | null> {
  let { data, error } = await supabase
    .from('articles')
    .insert([article])
    .select()
    .single();

  if (error && (error.message.includes('schema cache') || error.message.includes('hero_caption') || error.message.includes('image_captions'))) {
    const fallbackArticle = cleanPayloadForDb(article, error.message);
    const fallbackRes = await supabase
      .from('articles')
      .insert([fallbackArticle])
      .select()
      .single();
    data = fallbackRes.data;
    error = fallbackRes.error;
    if (data) {
      if (article.hero_caption) (data as Record<string, unknown>).hero_caption = article.hero_caption;
      if (article.image_captions) (data as Record<string, unknown>).image_captions = article.image_captions;
    }
  }

  if (error) {
    console.error('[articles] createArticle error:', error.message);
    return null;
  }

  if (data) {
    if (article.hero_caption !== undefined || article.image_captions !== undefined) {
      await saveCaptionsSafe(data.id, article.slug, {
        hero_caption: article.hero_caption ?? '',
        image_captions: article.image_captions ?? [],
      });
      (data as Record<string, unknown>).hero_caption = article.hero_caption ?? '';
      (data as Record<string, unknown>).image_captions = article.image_captions ?? [];
    }
  }

  return normalizeArticle(data);
}

// ── UPDATE ────────────────────────────────────────────────────────────────────

export async function updateArticle(idOrSlug: string, updates: ArticleUpdate): Promise<{ article?: Article; error?: string }> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  
  let query = supabase
    .from('articles')
    .update({ ...updates, updated_at: new Date().toISOString() });

  if (isUuid) {
    query = query.eq('id', idOrSlug);
  } else {
    // Jika bukan UUID, cari berdasarkan slug
    query = query.eq('slug', updates.slug || idOrSlug);
  }

  let { data, error } = await query.select().maybeSingle();

  // Jika error karena kolom opsional (hero_caption / image_captions) belum ada di skema Postgres
  if (error && (error.message.includes('schema cache') || error.message.includes('hero_caption') || error.message.includes('image_captions'))) {
    const fallbackUpdates = cleanPayloadForDb(updates, error.message);
    let fallbackQuery = supabase
      .from('articles')
      .update({ ...fallbackUpdates, updated_at: new Date().toISOString() });
    if (isUuid) {
      fallbackQuery = fallbackQuery.eq('id', idOrSlug);
    } else {
      fallbackQuery = fallbackQuery.eq('slug', updates.slug || idOrSlug);
    }
    const fallbackRes = await fallbackQuery.select().maybeSingle();
    data = fallbackRes.data;
    error = fallbackRes.error;
    if (data) {
      if (updates.hero_caption !== undefined) (data as Record<string, unknown>).hero_caption = updates.hero_caption;
      if (updates.image_captions !== undefined) (data as Record<string, unknown>).image_captions = updates.image_captions;
    }
  }

  if (error) {
    console.error('[articles] updateArticle error:', error.message);
    return { error: error.message };
  }

  if (!data) {
    // ── AUTO-UPSERT ──
    // Jika artikel belum ada di database Supabase, buatkan langsung (INSERT)
    const targetSlug = updates.slug || (isUuid ? generateSlug(updates.title || 'article') : idOrSlug);
    const insertPayload: Record<string, any> = {
      slug: targetSlug,
      title: updates.title || 'Untitled Article',
      category: updates.category || 'Journal',
      date: updates.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      read_time: updates.read_time || '3 min read',
      excerpt: updates.excerpt || '',
      content: Array.isArray(updates.content) ? updates.content : [],
      image: updates.image || '/images/catalog/catalog-11.jpg',
      images: Array.isArray(updates.images) ? updates.images : [],
      image_captions: Array.isArray(updates.image_captions) ? updates.image_captions : [],
      hero_caption: updates.hero_caption || '',
      featured: Boolean(updates.featured),
      published: updates.published !== false,
      updated_at: new Date().toISOString(),
    };

    let inserted = await supabase
      .from('articles')
      .upsert(insertPayload, { onConflict: 'slug' })
      .select()
      .maybeSingle();

    if (inserted.error && (inserted.error.message.includes('schema cache') || inserted.error.message.includes('hero_caption') || inserted.error.message.includes('image_captions'))) {
      const fallbackInsertPayload = cleanPayloadForDb(insertPayload, inserted.error.message);
      inserted = await supabase
        .from('articles')
        .upsert(fallbackInsertPayload, { onConflict: 'slug' })
        .select()
        .maybeSingle();
    }

    if (inserted.error) {
      console.error('[articles] auto-upsert error:', inserted.error.message);
      return { error: inserted.error.message };
    }

    if (inserted.data) {
      data = inserted.data;
    } else {
      return { error: 'Gagal menyimpan artikel ke database' };
    }
  }

  // Save captions to cloud storage under both ID and slug
  const targetId = data?.id ? String(data.id) : (isUuid ? idOrSlug : undefined);
  const targetSlug = data?.slug ? String(data.slug) : (!isUuid ? idOrSlug : updates.slug);

  if (updates.hero_caption !== undefined || updates.image_captions !== undefined) {
    await saveCaptionsSafe(targetId, targetSlug, {
      hero_caption: updates.hero_caption ?? '',
      image_captions: updates.image_captions ?? [],
    });
    if (data) {
      (data as Record<string, unknown>).hero_caption = updates.hero_caption ?? '';
      (data as Record<string, unknown>).image_captions = updates.image_captions ?? [];
    }
  }

  return { article: normalizeArticle(data) };
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function deleteArticle(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('articles')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[articles] deleteArticle error:', error.message);
    return false;
  }
  await deleteCaptionsSafe(id);
  return true;
}

// ── JOURNAL SECTION BRIDGE ────────────────────────────────────────────────────

/**
 * Fetch the latest N published articles and convert them to JournalArticleData
 * shape so the homepage JournalSection can display them dynamically from DB.
 * Falls back to empty array if DB is unreachable (homepage will use sections.json default).
 */
export async function getLatestArticlesForJournal(limit = 2): Promise<
  Array<{ id: string; title: string; date: string; excerpt: string; image: string; href: string }>
> {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('id, slug, title, date, excerpt, image, featured')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) return [];

    return data.map((a) => ({
      id: String(a.id),
      title: String(a.title ?? ''),
      date: String(a.date ?? ''),
      excerpt: String(a.excerpt ?? ''),
      image: String(a.image ?? '/images/catalog/catalog-11.jpg'),
      href: `/news/${String(a.slug ?? '')}`,
    }));
  } catch {
    return [];
  }
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

// Normalize content field: DB stores as TEXT (JSON string) or JSONB array
function normalizeArticle(
  raw: Record<string, unknown>,
  captionsMap?: Record<string, { hero_caption?: string; image_captions?: string[] }>
): Article {
  const id = String(raw.id);
  const slug = String(raw.slug ?? '');
  const savedCaptions = captionsMap?.[id] || captionsMap?.[slug];

  let content: string[] = [];
  if (Array.isArray(raw.content)) {
    content = raw.content as string[];
  } else if (typeof raw.content === 'string') {
    try {
      const parsed = JSON.parse(raw.content as string);
      content = Array.isArray(parsed) ? parsed : [raw.content as string];
    } catch {
      content = [raw.content as string];
    }
  }

  let images: string[] = [];
  if (Array.isArray(raw.images)) {
    images = raw.images as string[];
  } else if (typeof raw.images === 'string') {
    try {
      const parsed = JSON.parse(raw.images as string);
      images = Array.isArray(parsed) ? parsed : [];
    } catch {
      images = [];
    }
  }

  let hero_caption: string | undefined = undefined;
  if (savedCaptions && typeof savedCaptions.hero_caption === 'string') {
    hero_caption = savedCaptions.hero_caption;
  } else if (raw.hero_caption != null) {
    hero_caption = String(raw.hero_caption);
  }

  let image_captions: string[] = [];
  if (savedCaptions && Array.isArray(savedCaptions.image_captions)) {
    image_captions = savedCaptions.image_captions;
  } else if (Array.isArray(raw.image_captions)) {
    image_captions = raw.image_captions as string[];
  } else if (typeof raw.image_captions === 'string') {
    try {
      const parsed = JSON.parse(raw.image_captions as string);
      image_captions = Array.isArray(parsed) ? parsed : [];
    } catch {
      image_captions = [];
    }
  }

  return {
    id,
    slug,
    title: String(raw.title ?? ''),
    category: String(raw.category ?? 'Journal'),
    date: String(raw.date ?? ''),
    read_time: String(raw.read_time ?? ''),
    excerpt: String(raw.excerpt ?? ''),
    content,
    image: String(raw.image ?? ''),
    hero_caption,
    images,
    image_captions,
    featured: Boolean(raw.featured),
    published: Boolean(raw.published ?? true),
    created_at: raw.created_at ? String(raw.created_at) : undefined,
    updated_at: raw.updated_at ? String(raw.updated_at) : undefined,
  };
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
