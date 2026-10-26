# Arsitektur

## Tujuan

Menyediakan fondasi yang bersih, modular, dan mudah dikembangkan banyak developer untuk
e-commerce modest-fashion premium, tanpa membangun fitur lebih dulu dan tanpa abstraksi
yang belum dibutuhkan.

## Alasan pemilihan arsitektur

Pendekatan: **feature-based modules** dengan **adapter di batas integrasi**.

- **Feature-based**: kode yang berubah bersama disimpan bersama (katalog, keranjang, checkout, dst.).
  Developer bisa mengerjakan satu fitur tanpa menyentuh yang lain.
- **Adapter untuk provider**: pembayaran, kurir, WhatsApp, email, database, dan storage dibungkus
  interface. Mengganti provider berarti menambah satu adapter, bukan mengubah fitur.
- **Tidak over-engineered**: tidak ada layer, library state, atau interface sebelum ada kebutuhan nyata.
  Folder baru dibuat saat fitur pertama yang memakainya dibangun.

## Tanggung jawab tiap bagian

| Folder                 | Tanggung jawab                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------- |
| `src/app`              | Routing, layout, metadata, dan menyusun fitur menjadi halaman. Tanpa logika bisnis. |
| `src/components`       | UI bersama yang presentasional (props in, UI out).                                  |
| `src/features/<nama>`  | Tipe, logika, kontrak akses data, dan komponen khusus satu kapabilitas bisnis.      |
| `src/integrations/<x>` | Interface provider-agnostic per kapabilitas + adapter per provider.                 |
| `src/config`           | Konfigurasi statis dan akses environment variable bertipe.                          |

## Aturan arah dependensi

```
app  ->  features  ->  integrations  ->  config
 \________\_______ components (dipakai app dan features)
```

Dijaga otomatis oleh ESLint (`no-restricted-imports` di `eslint.config.mjs`):

- `components` tidak boleh mengimpor `app`, `features`, `integrations`.
- `features` tidak boleh mengimpor `app`.
- `integrations` tidak boleh mengimpor `app`, `features`, `components`.
- `config` tidak boleh mengimpor layer lain.

## Pola integrasi eksternal

1. Kapabilitas mendefinisikan interface di `src/integrations/<kapabilitas>/types.ts`
   (misalnya `PaymentGateway`).
2. Tiap provider mengimplementasikannya di file adapter sendiri.
3. `index.ts` kapabilitas memilih adapter aktif berdasarkan environment variable dan mengekspor satu instance.
4. Fitur hanya bergantung pada interface, tidak pada SDK provider.
5. Akses database dan storage gambar memakai pola yang sama (repository per fitur, implementasi di `integrations`).
6. Provider belum dipilih. Keputusan itu diambil saat integrasinya dibangun.

## Environment variables

- `src/config/env.ts` adalah satu-satunya tempat membaca `process.env` untuk nilai publik.
- `NEXT_PUBLIC_*` terbuka di browser. Secret **tidak boleh** memakai awalan itu.
- Secret server dibaca hanya di kode server (Server Component, Route Handler, Server Action,
  atau adapter di `integrations`), idealnya lewat modul terpisah `env.server.ts` saat dibutuhkan.
- Setiap variabel baru wajib ditambahkan ke `.env.example` tanpa nilai asli.

## Konvensi penamaan

- File dan folder: `kebab-case` (`product-card.tsx`, `order-status.ts`).
- Komponen React, tipe, interface: `PascalCase`. Fungsi dan variabel: `camelCase`.
- Hook: awalan `use` (`use-cart.ts`). Konstanta sungguhan: `UPPER_SNAKE_CASE`.
- Gunakan named export; default export hanya untuk file khusus Next.js (`page.tsx`, `layout.tsx`, dst.).
- Import memakai alias `@/` (`@/config/site`), bukan path relatif yang panjang.
- Public API sebuah fitur diekspor lewat `index.ts`; jangan mengimpor file internal fitur lain.

## Aturan clean code

- TypeScript strict; hindari `any`. Validasi input eksternal di batas sistem (API, form, webhook).
- Fungsi kecil dengan satu tujuan; pisahkan logika murni dari UI agar mudah diuji.
- Komponen presentasional tidak mengambil data; data diambil di server component atau layer fitur.
- Jangan menambah dependency tanpa alasan jelas. Jalankan `npm run check` sebelum membuka PR.
- Dukungan aksesibilitas dan mobile-first adalah bagian dari definisi selesai, bukan tambahan.

## Strategi pengujian (direncanakan)

Belum ada framework tes karena belum ada logika yang diuji. Saat logika pertama muncul:
Vitest untuk unit test logika murni, Testing Library untuk komponen, Playwright untuk alur
penting (checkout). Struktur saat ini mendukung ini karena logika dipisahkan dari UI dan provider.

## Rencana pengembangan bertahap

1. **Fondasi** (ini): struktur, tooling, token desain, dokumentasi.
2. **Design system dan shell**: font, komponen dasar, header/footer, halaman brand dan About Us.
3. **Katalog**: model produk (foto, ukuran, warna, harga, diskon, stok), daftar, detail, search/filter/sort.
4. **Keranjang** dan **autentikasi/akun**.
5. **Checkout, pembayaran, dan pesanan**: QRIS, virtual account/transfer, kartu; status pesanan.
6. **Pengiriman dan inventori**: ongkir, pelacakan, manajemen stok.
7. **Notifikasi dan konten**: WhatsApp dan email pasca-pembayaran, journal, newsletter.
8. **Hardening**: tes, CI, observability, performa, aksesibilitas, SEO.

Provider dipilih saat tahap yang membutuhkannya dimulai.
