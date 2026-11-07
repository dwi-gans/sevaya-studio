# 🏛 Panduan Arsitektur & Struktur Proyek (Clean & Modular)

Dokumen ini menjelaskan struktur proyek Sevaya Studio agar setiap fitur baru dan section baru bisa dibuat secara **Plug & Play** (tinggal buat, tinggal panggil tanpa merusak file lain).

---

## 📂 Struktur Direktori Utama

```text
src/
├── components/
│   ├── common/              <-- Primitif bersama (StudioImage, PriceTag, dll)
│   ├── sections/            <-- Registry & daftar section website (Hero, Spotlight, Journal, dll)
│   ├── ui/                  <-- Elemen UI murni (Icon, RevealOnScroll, Modal)
│   └── layout/              <-- Shell global (Header, Footer, Navigation)
│
├── features/                <-- Modul Fitur Mandiri (Business Capabilities)
│   ├── catalog/             <-- Fetching & mapping produk
│   ├── quick-add/           <-- Modal & tombol cepat beli
│   └── inventory/           <-- Status stok, StockBadge, mutasi
│
├── context/                 <-- State global (Cart, Auth, Language, Toast)
└── app/                     <-- Next.js App Router (Hanya merakit section & layout)
```

---

## 1. 🖼️ Pengaturan Gambar Sentral (`StudioImage`)
**Lokasi:** `@/components/common`

Jangan memanggil `next/image` secara langsung dengan parameter berulang. Gunakan `<StudioImage>`:

```tsx
import { StudioImage } from '@/components/common';

// Di section mana pun:
<StudioImage
  src={product.image}
  alt={product.title}
  fill
  preset="catalog" // Pilihan preset: 'catalog' | 'hero' | 'spotlight' | 'thumbnail' | 'journal'
/>
```

> **Keuntungan:** Kualitas Retina (HD 95), responsive sizes, dan fallback otomatis diatur dari **1 file sentral**. Jika ingin mengubah konfigurasi gambar seluruh website, Anda cukup ubah file `src/components/common/StudioImage.tsx`.

---

## 2. 🏷️ Format Harga Sentral (`PriceTag`)
**Lokasi:** `@/components/common`

Menampilkan harga rupiah, harga coret, dan badge diskon otomatis:

```tsx
import { PriceTag } from '@/components/common';

<PriceTag price={1359200} originalPrice={1699000} size="md" />
```

---

## 3. 🧩 Cara Menambah Section Baru di Homepage (3 Langkah)

Jika Anda ingin membuat section baru di homepage (contoh: `PromoBannerSection`):

### Langkah 1: Buat Komponen Section
Buat file di `src/components/home/PromoBannerSection.tsx`:
```tsx
export function PromoBannerSection() {
  return (
    <section className="py-12 bg-black text-white text-center">
      <h2>Promo Spesial Akhir Pekan</h2>
    </section>
  );
}
```

### Langkah 2: Daftarkan di Registry
Buka `src/components/sections/index.ts` dan tambahkan export:
```tsx
export { PromoBannerSection } from '@/components/home/PromoBannerSection';
```

### Langkah 3: Panggil di `src/app/page.tsx`
```tsx
import {
  HeroSection,
  ProductGrid,
  PromoBannerSection, // <-- Tinggal panggil di sini
  CategorySpotlight,
  Footer,
} from '@/components/sections';

export default async function HomePage() {
  return (
    <main>
      <HeroSection />
      <PromoBannerSection />
      <ProductGrid />
      <Footer />
    </main>
  );
}
```

---

## 4. 📦 Cara Membuat Fitur Baru di `src/features/`

Ketika ada fitur baru (misal: `wishlist`, `reviews`, atau `countdown`):
1. Buat folder di `src/features/[nama-fitur]/`
2. Simpan komponen dan hook fitur di dalam folder tersebut
3. Buat `index.ts` untuk mengekspor komponen publiknya
4. Section mana pun yang ingin menggunakan fitur tersebut cukup mengimpor dari `@/features/[nama-fitur]`.
