-- ==============================================================================
-- SEVAYA ATELIER - SUPABASE DATABASE SCHEMA
-- Jalankan script ini di menu "SQL Editor" pada Supabase Dashboard Anda.
-- ==============================================================================

-- 1. Buat Tabel Produk (Products)
CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    edition TEXT,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    badge TEXT,
    image TEXT NOT NULL,
    swatches JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Aktifkan Row Level Security (RLS) & Beri Izin Akses Read Publik
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Access" 
ON public.products 
FOR SELECT 
TO public 
USING (true);

-- 3. Masukkan Data Katalog Awal (Initial Catalog Seed)
INSERT INTO public.products (slug, title, edition, price, original_price, badge, image, swatches)
VALUES
(
    'fina-abaya-stripe-2',
    'Fina Abaya - Stripe 2.0',
    'Edition 2.0',
    1339000,
    1489000,
    NULL,
    '/images/catalog/catalog-01.jpg',
    '[{"name":"Black","color":"#1A1A1A"},{"name":"Garnet","color":"#6B2D2B"},{"name":"Caramel","color":"#C68B59"},{"name":"Peach","color":"#E5A894"}]'::jsonb
),
(
    'fina-abaya-classic-1',
    'Fina Abaya 1.0',
    'Classic 1.0',
    1339000,
    NULL,
    'Best Seller',
    '/images/catalog/catalog-03.jpg',
    '[{"name":"Black","color":"#202020"},{"name":"Navy","color":"#1C2833"},{"name":"Dark Choco","color":"#4A2E1B"},{"name":"Olive Brown","color":"#5D5341"}]'::jsonb
),
(
    'tala-abaya-cloudmatte',
    'Tala Abaya (Cloudmatte)',
    'Cloudmatte Bemberg',
    1359200,
    1699000,
    'Sale -20%',
    '/images/catalog/catalog-18.jpg',
    '[{"name":"Emerald","color":"#2E5A44"},{"name":"Brown Taupe","color":"#4C3B32"},{"name":"Dove Grey","color":"#A29A90"},{"name":"Bay Leaf","color":"#7D8876"}]'::jsonb
),
(
    'fina-abaya-summer-stripe',
    'Fina Abaya - Stripe Edition',
    'Summer Light Stripe',
    1339000,
    NULL,
    NULL,
    '/images/catalog/catalog-13.jpg',
    '[{"name":"Black Stripe","color":"#2C2B29"},{"name":"Oatmeal Stripe","color":"#C2B8AA"},{"name":"Clay Stripe","color":"#8C675B"}]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;
