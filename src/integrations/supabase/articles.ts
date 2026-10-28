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
  images: string[];        // foto-foto isi artikel (bisa lebih dari 1)
  featured: boolean;
  published: boolean;
  created_at?: string;
  updated_at?: string;
}

export type ArticleInsert = Omit<Article, 'id' | 'created_at' | 'updated_at'>;
export type ArticleUpdate = Partial<ArticleInsert>;

export const ARTICLE_CATEGORIES = ['All Stories', 'Journal', 'Event'];

// ── READ ─────────────────────────────────────────────────────────────────────

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
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    if (error) {
      console.warn('[articles] getArticles warning/fallback:', error.message);
    }
    return getFallbackInitialArticles();
  }
  return data.map(normalizeArticle);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (!error && data) {
    return normalizeArticle(data);
  }

  // Fallback to INITIAL_ARTICLES if not found in db
  const found = INITIAL_ARTICLES.find((a) => a.slug === slug);
  if (found) {
    return {
      id: found.id,
      slug: found.slug,
      title: found.title,
      category: found.category,
      date: found.date,
      read_time: found.readTime,
      excerpt: found.excerpt,
      content: found.content,
      image: found.image,
      images: ['/images/catalog/catalog-12.jpg'],
      featured: Boolean(found.featured),
      published: true,
    };
  }

  return null;
}

export async function getAllArticlesAdmin(): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    if (error) {
      console.warn('[articles] getAllArticlesAdmin warning/fallback:', error.message);
    }
    return getFallbackInitialArticles();
  }
  return data.map(normalizeArticle);
}

// ── CREATE ────────────────────────────────────────────────────────────────────

export async function createArticle(article: ArticleInsert): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .insert([article])
    .select()
    .single();

  if (error) {
    console.error('[articles] createArticle error:', error.message);
    return null;
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

  const { data, error } = await query.select().maybeSingle();

  if (error) {
    console.error('[articles] updateArticle error:', error.message);
    return { error: error.message };
  }

  if (!data) {
    // ── AUTO-UPSERT ──
    // Jika artikel belum ada di database Supabase, buatkan langsung (INSERT)
    const targetSlug = updates.slug || (isUuid ? generateSlug(updates.title || 'article') : idOrSlug);
    const insertPayload = {
      slug: targetSlug,
      title: updates.title || 'Untitled Article',
      category: updates.category || 'Journal',
      date: updates.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      read_time: updates.read_time || '3 min read',
      excerpt: updates.excerpt || '',
      content: Array.isArray(updates.content) ? updates.content : [],
      image: updates.image || '/images/catalog/catalog-11.jpg',
      images: Array.isArray(updates.images) ? updates.images : [],
      featured: Boolean(updates.featured),
      published: updates.published !== false,
      updated_at: new Date().toISOString(),
    };

    const inserted = await supabase
      .from('articles')
      .upsert(insertPayload, { onConflict: 'slug' })
      .select()
      .maybeSingle();

    if (inserted.error) {
      console.error('[articles] auto-upsert error:', inserted.error.message);
      return { error: inserted.error.message };
    }

    if (inserted.data) {
      return { article: normalizeArticle(inserted.data) };
    }

    return { error: 'Gagal menyimpan artikel ke database' };
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
  return true;
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

// Normalize content field: DB stores as TEXT (JSON string) or JSONB array
function normalizeArticle(raw: Record<string, unknown>): Article {
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

  return {
    id: String(raw.id),
    slug: String(raw.slug ?? ''),
    title: String(raw.title ?? ''),
    category: String(raw.category ?? 'Journal'),
    date: String(raw.date ?? ''),
    read_time: String(raw.read_time ?? ''),
    excerpt: String(raw.excerpt ?? ''),
    content,
    image: String(raw.image ?? ''),
    images,
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
