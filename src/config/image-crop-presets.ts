/**
 * Sumber kebenaran tunggal untuk semua preset crop gambar.
 *
 * Cara menambah preset baru:
 *   1. Tentukan `aspect` berdasarkan rasio container tempat gambar BENAR-BENAR ditampilkan.
 *   2. Tambahkan entri di `CROP_PRESETS` di bawah.
 *   3. Gunakan hook `useImageCropper({ preset: CROP_PRESETS.namaPreset, onConfirm })`.
 *
 * Lihat docs/IMAGE-CROPPER.md untuk contoh lengkap.
 */

export type CropPreset = {
  /** Identifier unik, misal "hero-home" */
  id: string;
  /** Label tombol default "Pas ...", misal "Pas Hero" */
  label: string;
  /** Rasio lebar/tinggi crop (desktop), misal 16/9 */
  aspect: number;
  /** Rasio mobile jika berbeda dari desktop (opsional) */
  mobileAspect?: number;
  /** Batas lebar output hasil crop (px) */
  outputMaxWidth: number;
  /** Format output file */
  outputFormat?: 'image/webp' | 'image/jpeg';
  /** Kualitas kompresi 0–1, default 0.9 */
  quality?: number;
};

/**
 * Hero Home: full-viewport-height, landscape di desktop, portrait di mobile.
 * aspect desktop  = 16:9  (paling umum untuk layar landscape)
 * mobileAspect   = 9:16  (ponsel portrait)
 */
export const CROP_PRESETS = {
  heroHome: {
    id: 'hero-home',
    label: 'Hero Desktop (16:9)',
    aspect: 16 / 9,
    mobileAspect: 9 / 16,
    outputMaxWidth: 1920,
    outputFormat: 'image/webp',
    quality: 0.88,
  },
  heroHomeMobile: {
    id: 'hero-home-mobile',
    label: 'Hero Mobile (9:16)',
    aspect: 9 / 16,
    outputMaxWidth: 1080,
    outputFormat: 'image/webp',
    quality: 0.88,
  },
  categorySpotlight: {
    id: 'category-spotlight',
    label: 'Kategori (4:3)',
    aspect: 4 / 3,
    outputMaxWidth: 2000,
    outputFormat: 'image/webp',
    quality: 0.96,
  },
  aboutStory: {
    id: 'about-story',
    label: 'About (4:3)',
    aspect: 4 / 3,
    outputMaxWidth: 2400,
    outputFormat: 'image/webp',
    quality: 0.96,
  },
  productCard: {
    id: 'product-card',
    label: 'Kartu Produk',
    aspect: 3 / 4,
    outputMaxWidth: 1600,
    outputFormat: 'image/webp',
    quality: 0.95,
  },
  banner: {
    id: 'banner',
    label: 'Banner',
    aspect: 21 / 9,
    outputMaxWidth: 2560,
    outputFormat: 'image/webp',
    quality: 0.95,
  },
  square: {
    id: 'square',
    label: 'Kotak',
    aspect: 1,
    outputMaxWidth: 1600,
    outputFormat: 'image/webp',
    quality: 0.95,
  },
} as const satisfies Record<string, CropPreset>;

export type CropPresetKey = keyof typeof CROP_PRESETS;
