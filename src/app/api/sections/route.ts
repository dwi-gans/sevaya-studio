import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/auth-server';
import { verifyAdminSession } from '@/lib/auth-admin';
import {
  DEFAULT_SITE_SECTIONS,
  DEFAULT_CLOSER_LOOK,
  DEFAULT_CONSCIOUS_PAGE,
  DEFAULT_HOME_NARRATIVE,
  DEFAULT_JOURNAL_HEADER,
  SiteSectionsConfig,
} from '@/integrations/supabase/sections';

export const runtime = 'nodejs';

const SECTIONS_FILE = 'sections.json';
const DATA_DIR = path.join(process.cwd(), '.data');

// In-memory cache for public site sections (10s TTL, instantly updated on POST)
let cachedSections: SiteSectionsConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 10 * 1000;

const PUBLIC_CACHE_HEADERS = {
  'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
};

function readLocalSections(): SiteSectionsConfig | null {
  try {
    const filePath = path.join(DATA_DIR, SECTIONS_FILE);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content) as SiteSectionsConfig;
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function writeLocalSections(sections: SiteSectionsConfig) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(path.join(DATA_DIR, SECTIONS_FILE), JSON.stringify(sections, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

function mergeDeep(base: SiteSectionsConfig, incoming: Partial<SiteSectionsConfig>): SiteSectionsConfig {
  return {
    ...base,
    ...incoming,
    hero: {
      ...base.hero,
      ...(incoming.hero || {}),
    },
    closerLook: {
      ...(base.closerLook || DEFAULT_CLOSER_LOOK),
      ...(incoming.closerLook || {}),
    },
    spotlight: incoming.spotlight?.length ? incoming.spotlight : base.spotlight,
    spotlightIntro:
      incoming.spotlightIntro !== undefined ? incoming.spotlightIntro : base.spotlightIntro,
    narrative: {
      ...(base.narrative || DEFAULT_HOME_NARRATIVE),
      ...(incoming.narrative || {}),
    },
    consciousPage: {
      ...(base.consciousPage || DEFAULT_CONSCIOUS_PAGE),
      ...(incoming.consciousPage || {}),
    },
    conscious: {
      ...(base.conscious || DEFAULT_SITE_SECTIONS.conscious!),
      ...(incoming.conscious || {}),
    },
    lookbookPage: {
      ...(base.lookbookPage || DEFAULT_SITE_SECTIONS.lookbookPage!),
      ...(incoming.lookbookPage || {}),
    },
    lookbookVolumesConfig: {
      ...(base.lookbookVolumesConfig || DEFAULT_SITE_SECTIONS.lookbookVolumesConfig),
      ...(incoming.lookbookVolumesConfig || {}),
    },
    journal: incoming.journal?.length ? incoming.journal : base.journal,
    journalHeader: {
      ...(base.journalHeader || DEFAULT_JOURNAL_HEADER),
      ...(incoming.journalHeader || {}),
    },
    missionTextiles: {
      ...(base.missionTextiles || DEFAULT_SITE_SECTIONS.missionTextiles),
      ...(incoming.missionTextiles || {}),
    },
  };
}

/**
 * GET /api/sections
 * Returns the current site sections from memory cache, Supabase Storage, or disk.
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
      const merged = mergeDeep(DEFAULT_SITE_SECTIONS, parsed);

      writeLocalSections(merged);
      cachedSections = merged;
      cacheTimestamp = now;
      return NextResponse.json(
        { success: true, sections: merged },
        { headers: PUBLIC_CACHE_HEADERS }
      );
    }

    // Disk fallback if Supabase Storage is not reachable
    const local = readLocalSections();
    if (local) {
      const merged = mergeDeep(DEFAULT_SITE_SECTIONS, local);
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
    const local = readLocalSections();
    const fallback = local ? mergeDeep(DEFAULT_SITE_SECTIONS, local) : (cachedSections || DEFAULT_SITE_SECTIONS);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { success: true, sections: fallback, warning: message },
      { headers: PUBLIC_CACHE_HEADERS }
    );
  }
}

/**
 * POST /api/sections
 * Saves / updates the site sections in Supabase Storage and disk.
 * Uses deep merge so that editing one tab or device never wipes out other sections.
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
    const incomingSections = (body.sections || body) as Partial<SiteSectionsConfig>;

    if (!incomingSections || typeof incomingSections !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid sections data' },
        { status: 400 }
      );
    }

    // 1. Fetch current existing sections to do a clean deep-merge
    let existingSections = cachedSections || readLocalSections();
    if (!existingSections) {
      try {
        const { data } = await supabaseAdmin.storage.from('catalog').download(SECTIONS_FILE);
        if (data) {
          const t = await data.text();
          existingSections = JSON.parse(t) as SiteSectionsConfig;
        }
      } catch {
        // ignore
      }
    }

    const base = existingSections || DEFAULT_SITE_SECTIONS;
    const merged = mergeDeep(base, incomingSections);

    // 2. Write to disk first
    writeLocalSections(merged);

    // 3. Write to Supabase Storage
    const jsonStr = JSON.stringify(merged, null, 2);
    const buffer = Buffer.from(jsonStr, 'utf-8');

    const { error: uploadError } = await supabaseAdmin.storage
      .from('catalog')
      .upload(SECTIONS_FILE, buffer, {
        contentType: 'application/json',
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase Storage section upload error:', uploadError.message);
      // Still update memory & disk so localhost/current session retains it
      cachedSections = merged;
      cacheTimestamp = Date.now();
      return NextResponse.json({
        success: true,
        sections: merged,
        warning: `Saved locally, Supabase upload warning: ${uploadError.message}`,
      });
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
