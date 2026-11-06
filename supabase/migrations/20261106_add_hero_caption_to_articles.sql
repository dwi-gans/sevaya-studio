-- Tambahkan kolom hero_caption jika belum ada di tabel articles
ALTER TABLE public.articles
ADD COLUMN IF NOT EXISTS hero_caption text DEFAULT '';
