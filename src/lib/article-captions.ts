import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '@/lib/auth-server';

export interface ArticleCaptionsData {
  hero_caption?: string;
  image_captions?: string[];
}

export type CaptionsRegistry = Record<string, ArticleCaptionsData>;

const CAPTIONS_FILE = 'article_captions.json';
const DATA_DIR = path.join(process.cwd(), '.data');

let _cachedCaptions: CaptionsRegistry | null = null;
let _cachedCaptionsTime = 0;
const CACHE_TTL_MS = 15 * 1000;

export function invalidateCaptionsCache() {
  _cachedCaptions = null;
  _cachedCaptionsTime = 0;
}

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    // ignore
  }
}

function readLocalCaptions(): CaptionsRegistry {
  try {
    const filePath = path.join(DATA_DIR, CAPTIONS_FILE);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content) as CaptionsRegistry;
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {
    // ignore
  }
  return {};
}

function writeLocalCaptions(data: CaptionsRegistry) {
  try {
    ensureDataDir();
    const filePath = path.join(DATA_DIR, CAPTIONS_FILE);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

/**
 * Retrieves all article captions from memory cache -> Supabase Storage -> local disk
 */
export async function getAllArticleCaptions(forceFresh = false): Promise<CaptionsRegistry> {
  const now = Date.now();
  if (!forceFresh && _cachedCaptions && now - _cachedCaptionsTime < CACHE_TTL_MS) {
    return _cachedCaptions;
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from('catalog')
      .download(CAPTIONS_FILE);

    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text) as CaptionsRegistry;
      if (parsed && typeof parsed === 'object') {
        writeLocalCaptions(parsed);
        _cachedCaptions = parsed;
        _cachedCaptionsTime = now;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[article-captions] Supabase download error:', err);
  }

  const local = readLocalCaptions();
  _cachedCaptions = local;
  _cachedCaptionsTime = now;
  return local;
}

/**
 * Gets captions for a specific article by ID or slug
 */
export async function getCaptionsForArticle(idOrSlug: string): Promise<ArticleCaptionsData | null> {
  if (!idOrSlug) return null;
  const all = await getAllArticleCaptions();
  return all[idOrSlug] || null;
}

/**
 * Saves captions for an article under both its ID and slug so lookups are 100% resilient
 */
export async function saveCaptionsForArticle(
  id: string | undefined,
  slug: string | undefined,
  captions: ArticleCaptionsData
): Promise<void> {
  try {
    const registry = await getAllArticleCaptions(true);
    const updated: CaptionsRegistry = { ...registry };

    const payload: ArticleCaptionsData = {
      hero_caption: typeof captions.hero_caption === 'string' ? captions.hero_caption : '',
      image_captions: Array.isArray(captions.image_captions) ? captions.image_captions : [],
    };

    if (id) updated[id] = payload;
    if (slug) updated[slug] = payload;

    // Save locally
    writeLocalCaptions(updated);
    _cachedCaptions = updated;
    _cachedCaptionsTime = Date.now();

    // Upload to Supabase Storage
    const buffer = Buffer.from(JSON.stringify(updated, null, 2), 'utf-8');
    await supabaseAdmin.storage
      .from('catalog')
      .upload(CAPTIONS_FILE, buffer, {
        contentType: 'application/json',
        upsert: true,
      });
  } catch (err) {
    console.error('[article-captions] saveCaptionsForArticle error:', err);
  }
}

/**
 * Removes captions for a deleted article
 */
export async function deleteCaptionsForArticle(idOrSlug: string): Promise<void> {
  try {
    const registry = await getAllArticleCaptions(true);
    if (!registry[idOrSlug]) return;

    const updated = { ...registry };
    delete updated[idOrSlug];

    writeLocalCaptions(updated);
    _cachedCaptions = updated;
    _cachedCaptionsTime = Date.now();

    const buffer = Buffer.from(JSON.stringify(updated, null, 2), 'utf-8');
    await supabaseAdmin.storage
      .from('catalog')
      .upload(CAPTIONS_FILE, buffer, {
        contentType: 'application/json',
        upsert: true,
      });
  } catch (err) {
    console.error('[article-captions] deleteCaptionsForArticle error:', err);
  }
}
