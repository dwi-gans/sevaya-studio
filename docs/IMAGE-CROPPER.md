# Image Cropper — Panduan Penggunaan

Komponen modal crop gambar yang reusable. Satu modal + satu hook + satu sistem preset rasio. Cukup dipanggil dari gambar mana pun dengan rasio berbeda.

## Arsitektur

```
src/config/image-crop-presets.ts   ← sumber kebenaran preset
src/components/image-cropper/
  ├── ImageCropperModal.tsx         ← modal presentasional (tidak tahu bisnis)
  ├── useImageCropper.ts            ← hook state wrapper
  ├── getCroppedImage.ts            ← util canvas (pure, tanpa side-effect)
  └── index.ts                      ← export publik
src/features/home/
  └── useHeroImageCropper.ts        ← wrapper bisnis spesifik hero
```

---

## 1. Menambah Preset Baru

Buka [`src/config/image-crop-presets.ts`](../src/config/image-crop-presets.ts) dan tambahkan entri baru:

```ts
// Contoh: preset kartu produk 3:4
productCard: {
  id: 'product-card',
  label: 'Kartu Produk',
  aspect: 3 / 4,          // ← rasio container gambar BENAR-BENAR ditampilkan
  outputMaxWidth: 800,
  outputFormat: 'image/webp',
  quality: 0.9,
},

// Contoh: banner super-wide 21:9
banner: {
  id: 'banner',
  label: 'Banner',
  aspect: 21 / 9,
  outputMaxWidth: 2100,
  outputFormat: 'image/webp',
  quality: 0.9,
},
```

> **Penting:** nilai `aspect` harus diambil dari rasio container tempat gambar *benar-benar* ditampilkan di layar — bukan ukuran gambar asli. Misalnya jika container punya `aspect-[3/4]` di CSS, gunakan `3 / 4`.

---

## 2. Contoh Pemakaian Hook

```tsx
'use client';
import { useImageCropper, ImageCropperModal } from '@/components/image-cropper';
import { CROP_PRESETS } from '@/config/image-crop-presets';

export function ProductImageUpload() {
  const { openCropper, cropperProps } = useImageCropper({
    preset: CROP_PRESETS.productCard,
    onConfirm: async ({ file, wasCropped }) => {
      const url = await uploadFileToStorage(file, 'uploads');
      console.log('Uploaded:', url, 'was cropped:', wasCropped);
    },
  });

  return (
    <>
      <input type="file" accept="image/*"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) openCropper(f); }} />
      <ImageCropperModal {...cropperProps} />
    </>
  );
}
```

---

## 3. Props `<ImageCropperModal>`

| Prop | Tipe | Default | Keterangan |
|------|------|---------|-----------|
| `open` | `boolean` | — | Apakah modal terlihat |
| `file` | `File \| null` | — | File gambar yang akan di-crop |
| `preset` | `CropPreset` | — | Preset rasio & output (dari `CROP_PRESETS`) |
| `extraRatios` | `RatioOption[]` | `[]` | Rasio tambahan di toolbar |
| `allowFreeRatio` | `boolean` | `true` | Tampilkan tombol "Bebas" |
| `allowSkip` | `boolean` | `true` | Tampilkan tombol "Gunakan Asli" |
| `title` | `string` | `'Sesuaikan / Potong Foto'` | Judul header modal |
| `description` | `string` | `'Atur posisi agar pas dengan tampilan di website & mobile'` | Subjudul header |
| `onConfirm` | `(result: CropperResult) => void \| Promise<void>` | — | Dipanggil saat "Pasang Foto" |
| `onCancel` | `() => void` | — | Dipanggil saat tutup modal |

### `CropperResult`

```ts
interface CropperResult {
  file: File;      // file siap upload
  blob: Blob;      // blob hasil crop
  width: number;   // lebar output (px); 0 jika "Gunakan Asli"
  height: number;  // tinggi output (px); 0 jika "Gunakan Asli"
  wasCropped: boolean; // false jika user klik "Gunakan Asli"
}
```

### `CropPreset`

```ts
type CropPreset = {
  id: string;
  label: string;
  aspect: number;          // rasio desktop
  mobileAspect?: number;   // rasio mobile (jika berbeda → toggle Desktop/Mobile muncul)
  outputMaxWidth: number;  // batas lebar output (px)
  outputFormat?: 'image/webp' | 'image/jpeg';
  quality?: number;        // 0–1, default 0.9
};
```

---

## 4. Perilaku Tombol Toolbar

| Tombol | Perilaku |
|--------|---------|
| **Pas [preset.label]** | Aktif default; menggunakan `preset.aspect` (atau `preset.mobileAspect` jika mode Mobile) |
| **4:3 / 16:9 / 1:1** | Rasio bawaan; aktif = tombol hitam |
| **Bebas** | Crop bebas tanpa paksa rasio; hanya muncul jika `allowFreeRatio=true` |
| **Rotate ←/→** | Putar gambar 90° ke kiri/kanan |
| **Reset** | Kembalikan crop, zoom, rotasi ke posisi awal |
| **Desktop / Mobile** | Hanya muncul jika `preset.mobileAspect` ada; mengganti rasio aktif |

---

## 5. Kandidat Pemakaian Berikutnya

> Jangan migrasi sekarang — hanya daftar untuk referensi masa depan.

1. **Foto produk / swatch** — `ProductModal.tsx`, preset `productCard` (3:4)
2. **Gambar lookbook/chapter** — `HomeSectionsTab.tsx`, preset banner atau custom
3. **Gambar spotlight** — `HomeSectionsTab.tsx`, target `spotlight-0` / `spotlight-1`
4. **Gambar journal** — `HomeSectionsTab.tsx`, target `journal-0` / `journal-1`
5. **Gambar artikel** — `ArticleModal.tsx`
6. **Upload media library** — `MediaLibraryTab.tsx`
7. **Gambar Conscious / founder** — `ConsciousTab.tsx`
