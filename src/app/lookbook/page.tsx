import { getSiteSections, DEFAULT_SITE_SECTIONS } from '@/integrations/supabase';
import { fetchCatalogProducts } from '@/features/catalog';
import { LookbookClient } from '@/components/lookbook/LookbookClient';

export const revalidate = 0;

export default async function LookbookPage() {
  const [sections, products] = await Promise.all([
    getSiteSections(true),
    fetchCatalogProducts(),
  ]);

  const cfg =
    sections.lookbookVolumesConfig?.['vol-1'] ||
    sections.lookbookPage ||
    DEFAULT_SITE_SECTIONS.lookbookPage!;

  return <LookbookClient initialConfig={cfg} initialProducts={products} />;
}
