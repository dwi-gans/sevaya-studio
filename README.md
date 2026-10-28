# Fashion E-Commerce Foundation

Fondasi proyek untuk website e-commerce modest-fashion yang premium, minimalis, dan editorial.
Repositori ini sengaja **belum** berisi halaman, fitur, atau logika bisnis; hanya struktur,
konfigurasi, dan aturan kerja agar pengembangan bisa dilakukan bertahap dan rapi.

## Teknologi

| Teknologi                       | Fungsi                                     |
| ------------------------------- | ------------------------------------------ |
| Next.js 16 (App Router)         | Framework aplikasi dan routing             |
| React 19                        | Library UI                                 |
| TypeScript (strict)             | Strong typing                              |
| Tailwind CSS 4                  | Styling dan design tokens                  |
| ESLint 9 + `eslint-config-next` | Kualitas kode dan aturan batas antar-layer |
| Prettier (+ plugin Tailwind)    | Format kode konsisten                      |
| npm                             | Package manager                            |

## Setup

Prasyarat: Node.js 20.9 atau lebih baru (disarankan versi di `.nvmrc`).

```bash
npm install
cp .env.example .env.local   # opsional; semua variabel punya default
npm run dev                  # http://localhost:3000
```

## Script

| Perintah            | Fungsi                                             |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Jalankan development server                        |
| `npm run build`     | Build production                                   |
| `npm run start`     | Jalankan hasil build                               |
| `npm run typecheck` | Cek tipe TypeScript                                |
| `npm run lint`      | Jalankan ESLint (termasuk aturan batas dependensi) |
| `npm run format`    | Format semua file dengan Prettier                  |
| `npm run check`     | Typecheck + lint + format check (untuk sebelum PR) |

## Environment variables

- Salin `.env.example` ke `.env.local`. File `.env*` selain `.env.example` tidak masuk Git.
- Variabel berawalan `NEXT_PUBLIC_` terbuka di browser. Jangan taruh secret di sana.
- Saat ini hanya ada `NEXT_PUBLIC_SITE_URL`. Variabel provider (pembayaran, kurir, dll.) ditambahkan
  saat integrasinya dibangun. Aturan lengkap ada di `docs/ARCHITECTURE.md`.

## Struktur

```
src/
  app/            Routing Next.js, layout, global CSS (hanya komposisi)
  components/     UI bersama yang presentasional
  features/       Satu folder per kapabilitas bisnis
  integrations/   Adapter ke provider eksternal di balik interface
  config/         Konfigurasi statis dan akses environment variable
docs/
  ARCHITECTURE.md Alasan arsitektur, konvensi, dan rencana bertahap
```

Detail tanggung jawab dan aturan ada di [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
`src/app/page.tsx` hanya placeholder minimal karena Next.js butuh satu route agar bisa berjalan.
