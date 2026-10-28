-- Tambahkan kolom images jika belum ada di tabel articles
ALTER TABLE public.articles
ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb;
