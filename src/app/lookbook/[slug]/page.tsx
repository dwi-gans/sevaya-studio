import { notFound } from 'next/navigation';
import { getSiteSections, DEFAULT_SITE_SECTIONS } from '@/integrations/supabase';
import { fetchCatalogProducts } from '@/features/catalog';
import { LookbookVolumeClient } from '@/components/lookbook/LookbookVolumeClient';

export const revalidate = 0;

export default async function LookbookVolumePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const targetSlug = slug || 'vol-2';

  const [sections, products] = await Promise.all([
    getSiteSections(true),
    fetchCatalogProducts(),
  ]);

  const cfg =
    sections.lookbookVolumesConfig?.[targetSlug] ||
    sections.lookbookVolumesConfig?.['vol-2'] ||
    sections.lookbookPage ||
    DEFAULT_SITE_SECTIONS.lookbookPage!;

  let volTitle = `${targetSlug.replace('-', ' ').toUpperCase()}`;
  let volDesc = 'A poetic transition into warmer tones, softer draperies, and intimate seasonal silhouettes designed for timeless elegance.';

  const foundLink = sections.lookbookLinks?.find((l) => l.href.includes(targetSlug) || l.id === targetSlug);
  if (foundLink) {
    volTitle = foundLink.label.toUpperCase();
    if (foundLink.hidden || cfg.hidden) {
      notFound();
    }
  } else if (cfg.hidden) {
    notFound();
  }

  return (
    <LookbookVolumeClient
      slug={targetSlug}
      initialConfig={cfg}
      initialProducts={products}
      initialVolTitle={volTitle}
      initialVolDesc={volDesc}
    />
  );
}
