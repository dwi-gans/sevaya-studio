import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/auth-server';
import { verifyAdminSession } from '@/lib/auth-admin';
import { DEFAULT_SITE_SECTIONS, DEFAULT_CONSCIOUS_PAGE, SiteSectionsConfig } from '@/integrations/supabase/sections';

export const runtime = 'nodejs';

const SECTIONS_FILE = 'sections.json';

// In-memory cache for public site sections (15s TTL, instantly updated on POST)
let cachedSections: SiteSectionsConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 15 * 1000;

const PUBLIC_CACHE_HEADERS = {
  'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
};

/**
 * GET /api/sections
 * Returns the current site sections from memory cache or Supabase Storage.
 * Single source of truth for both localhost and production hosting.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const bypassCache = url.searchParams.get('fresh') === '1';

  const now = Date.now();
  if (!bypassCache && cachedSections && now - cacheTimestamp < CACHE_TTL_MS) {
    return NextResponse.json(
      { success: true, sections: cachedSections },
      { headers: PUBLIC_CACHE_HEADERS }
    );
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from('catalog')
      .download(SECTIONS_FILE);

    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text) as Partial<SiteSectionsConfig>;
      const merged: SiteSectionsConfig = {
        ...DEFAULT_SITE_SECTIONS,
        ...parsed,
        hero: {
          ...DEFAULT_SITE_SECTIONS.hero,
          ...(parsed.hero || {}),
        },
        narrative: {
          ...DEFAULT_SITE_SECTIONS.narrative!,
          ...(parsed.narrative || {}),
        },
        journalHeader: {
          ...DEFAULT_SITE_SECTIONS.journalHeader!,
          ...(parsed.journalHeader || {}),
        },
        lookbookPage: {
          ...DEFAULT_SITE_SECTIONS.lookbookPage!,
          ...(parsed.lookbookPage || {}),
        },
        lookbookVolumesConfig: {
          ...DEFAULT_SITE_SECTIONS.lookbookVolumesConfig,
          ...(parsed.lookbookVolumesConfig || {}),
        },
        consciousPage: {
          ...DEFAULT_CONSCIOUS_PAGE,
          ...(parsed.consciousPage || {}),
        },
      };

      cachedSections = merged;
      cacheTimestamp = now;
      return NextResponse.json(
        { success: true, sections: merged },
        { headers: PUBLIC_CACHE_HEADERS }
      );
    }

    cachedSections = DEFAULT_SITE_SECTIONS;
    cacheTimestamp = now;
    return NextResponse.json(
      { success: true, sections: DEFAULT_SITE_SECTIONS },
      { headers: PUBLIC_CACHE_HEADERS }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { success: true, sections: cachedSections || DEFAULT_SITE_SECTIONS, warning: message },
      { headers: PUBLIC_CACHE_HEADERS }
    );
  }
}

/**
 * POST /api/sections
 * Saves / updates the site sections in Supabase Storage using privileged Service Role Key.
 * Instantly synchronizes in-memory cache so all clients see the changes immediately.
 */
export async function POST(req: NextRequest) {
  try {
    const session = verifyAdminSession(req);
    const isDev = process.env.NODE_ENV !== 'production';
    const authHeader = req.headers.get('x-admin-key');
    const isLocalAdmin = authHeader === 'sevaya-admin' || isDev;

    if (!session && !isLocalAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const sections = (body.sections || body) as SiteSectionsConfig;

    if (!sections || typeof sections !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid sections data' },
        { status: 400 }
      );
    }

    const merged: SiteSectionsConfig = {
      ...DEFAULT_SITE_SECTIONS,
      ...sections,
    };

    const jsonStr = JSON.stringify(merged, null, 2);
    const buffer = Buffer.from(jsonStr, 'utf-8');

    const { error: uploadError } = await supabaseAdmin.storage
      .from('catalog')
      .upload(SECTIONS_FILE, buffer, {
        contentType: 'application/json',
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { success: false, error: `Gagal simpan ke Supabase Storage: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Instantly update memory cache
    cachedSections = merged;
    cacheTimestamp = Date.now();

    return NextResponse.json({ success: true, sections: merged });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
