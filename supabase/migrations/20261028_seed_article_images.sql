-- Update default editorial images for existing seed articles in Supabase
UPDATE public.articles
SET images = jsonb_build_array('/images/catalog/catalog-12.jpg')
WHERE slug IN (
  'bemberg-cupro-silk',
  'the-art-of-fewer-better-choices',
  'pop-up-vol-1',
  '26-rhapsody-reflection',
  'architectural-silhouettes',
  'garment-care-guide',
  'private-atelier-trunk-show'
) AND (images IS NULL OR images = '[]'::jsonb);
