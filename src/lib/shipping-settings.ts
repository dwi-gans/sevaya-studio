import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '@/lib/auth-server';

export interface ShippingOriginSettings {
  shipper_name: string;
  shipper_phone: string;
  shipper_email: string;
  shipper_organization?: string;
  origin_address: string;
  origin_note: string;
  origin_postal_code: number;
  origin_area_id?: string;
  origin_area_name?: string;
  updated_at?: string;
}

const SHIPPING_SETTINGS_FILE = 'shipping_settings.json';
const DATA_DIR = path.join(process.cwd(), '.data');

export const DEFAULT_SHIPPING_ORIGIN: ShippingOriginSettings = {
  shipper_name: process.env.BITESHIP_ORIGIN_CONTACT_NAME || 'SEVAYA Store',
  shipper_phone: process.env.BITESHIP_ORIGIN_CONTACT_PHONE || '08123456789',
  shipper_email: process.env.BITESHIP_ORIGIN_CONTACT_EMAIL || 'info@sevaya-studio.com',
  shipper_organization: 'SEVAYA',
  origin_address: process.env.BITESHIP_ORIGIN_ADDRESS || 'Jl. Kebon Jeruk No. 10, Jakarta Barat',
  origin_note: process.env.BITESHIP_ORIGIN_NOTE || 'Toko SEVAYA',
  origin_postal_code: Number(process.env.BITESHIP_ORIGIN_POSTAL_CODE) || 11450,
  origin_area_id: process.env.BITESHIP_ORIGIN_AREA_ID || 'IDNP6IDNC149IDND847IDZ11450',
  origin_area_name: 'Kebon Jeruk, Jakarta Barat',
};

// In-memory cache (1 minute TTL on server)
let _cachedSettings: ShippingOriginSettings | null = null;
let _cachedSettingsTime = 0;
const CACHE_TTL_MS = 60 * 1000;

export function invalidateShippingSettingsCache() {
  _cachedSettings = null;
  _cachedSettingsTime = 0;
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

function readLocalSettings(): ShippingOriginSettings | null {
  try {
    const filePath = path.join(DATA_DIR, SHIPPING_SETTINGS_FILE);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content) as ShippingOriginSettings;
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function writeLocalSettings(data: ShippingOriginSettings) {
  try {
    ensureDataDir();
    const filePath = path.join(DATA_DIR, SHIPPING_SETTINGS_FILE);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

/**
 * Single source of truth for Shipping Origin (Pickup) Settings
 * Reads from Supabase Storage -> local disk -> environment variable defaults
 */
export async function getShippingOriginSettings(forceFresh = false): Promise<ShippingOriginSettings> {
  const now = Date.now();
  if (!forceFresh && _cachedSettings && now - _cachedSettingsTime < CACHE_TTL_MS) {
    return _cachedSettings;
  }

  // 1. Try Supabase Storage (Persistent across all Vercel serverless containers)
  try {
    const { data, error } = await supabaseAdmin.storage
      .from('catalog')
      .download(SHIPPING_SETTINGS_FILE);

    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text) as Partial<ShippingOriginSettings>;
      const merged: ShippingOriginSettings = {
        ...DEFAULT_SHIPPING_ORIGIN,
        ...parsed,
        origin_postal_code: Number(parsed.origin_postal_code) || DEFAULT_SHIPPING_ORIGIN.origin_postal_code,
      };

      writeLocalSettings(merged);
      _cachedSettings = merged;
      _cachedSettingsTime = now;
      return merged;
    }
  } catch (err) {
    console.warn('[shipping-settings] Supabase storage download error:', err);
  }

  // 2. Fallback to local disk (useful in local dev or temporary storage glitch)
  const local = readLocalSettings();
  if (local) {
    const merged: ShippingOriginSettings = {
      ...DEFAULT_SHIPPING_ORIGIN,
      ...local,
      origin_postal_code: Number(local.origin_postal_code) || DEFAULT_SHIPPING_ORIGIN.origin_postal_code,
    };
    _cachedSettings = merged;
    _cachedSettingsTime = now;
    return merged;
  }

  // 3. Fallback to default
  _cachedSettings = DEFAULT_SHIPPING_ORIGIN;
  _cachedSettingsTime = now;
  return DEFAULT_SHIPPING_ORIGIN;
}

/**
 * Saves shipping origin settings to Supabase Storage + local disk + updates memory cache
 */
export async function saveShippingOriginSettings(
  input: Partial<ShippingOriginSettings>
): Promise<{ success: boolean; settings: ShippingOriginSettings; error?: string }> {
  try {
    const current = await getShippingOriginSettings(true);
    const updated: ShippingOriginSettings = {
      ...current,
      ...input,
      shipper_name: input.shipper_name?.trim() || current.shipper_name,
      shipper_phone: input.shipper_phone?.trim() || current.shipper_phone,
      shipper_email: input.shipper_email?.trim() || current.shipper_email,
      shipper_organization: input.shipper_organization?.trim() || 'SEVAYA',
      origin_address: input.origin_address?.trim() || current.origin_address,
      origin_note: input.origin_note?.trim() || current.origin_note,
      origin_postal_code: Number(input.origin_postal_code) || current.origin_postal_code,
      origin_area_id: input.origin_area_id?.trim() || current.origin_area_id,
      origin_area_name: input.origin_area_name?.trim() || current.origin_area_name,
      updated_at: new Date().toISOString(),
    };

    // Upload to Supabase Storage
    const buffer = Buffer.from(JSON.stringify(updated, null, 2), 'utf-8');
    const { error } = await supabaseAdmin.storage
      .from('catalog')
      .upload(SHIPPING_SETTINGS_FILE, buffer, {
        contentType: 'application/json',
        upsert: true,
      });

    if (error) {
      console.error('[shipping-settings] Upload to Supabase error:', error.message);
      // Fallback save locally
      writeLocalSettings(updated);
      _cachedSettings = updated;
      _cachedSettingsTime = Date.now();
      return { success: false, settings: updated, error: error.message };
    }

    writeLocalSettings(updated);
    _cachedSettings = updated;
    _cachedSettingsTime = Date.now();
    return { success: true, settings: updated };
  } catch (err: any) {
    console.error('[shipping-settings] saveShippingOriginSettings exception:', err);
    return { success: false, settings: DEFAULT_SHIPPING_ORIGIN, error: err?.message || 'Gagal menyimpan pengaturan alamat.' };
  }
}
