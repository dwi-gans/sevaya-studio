-- Tambahkan kolom hero_caption dan image_captions jika belum ada di tabel articles
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS hero_caption text DEFAULT '';
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS image_captions jsonb DEFAULT '[]'::jsonb;
