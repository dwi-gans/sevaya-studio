import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/auth-server';

export const runtime = 'nodejs';

/**
 * GET /api/journal
 * Returns the latest 2 published articles formatted as JournalArticleData
 * for the homepage JournalSection client-side refresh.
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('articles')
      .select('id, slug, title, date, excerpt, image')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(2);

    if (error || !data || data.length === 0) {
      return NextResponse.json({ articles: [] });
    }

    const articles = data.map((a) => ({
      id: String(a.id),
      title: String(a.title ?? ''),
      date: String(a.date ?? ''),
      excerpt: String(a.excerpt ?? ''),
      image: String(a.image ?? '/images/catalog/catalog-11.jpg'),
      href: `/news/${String(a.slug ?? '')}`,
    }));

    return NextResponse.json(
      { articles },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (err) {
    console.warn('[journal API] error:', err);
    return NextResponse.json({ articles: [] });
  }
}
