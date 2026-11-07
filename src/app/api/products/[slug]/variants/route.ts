import { NextRequest, NextResponse } from 'next/server';
import { getServerInventoryVariants } from '@/lib/inventory-server';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug).toLowerCase().trim();
    const allVariants = await getServerInventoryVariants();
    const productVariants = allVariants.filter(
      (v) =>
        v.productSlug.toLowerCase().trim() === decodedSlug ||
        v.productId.toLowerCase().trim() === decodedSlug
    );

    return NextResponse.json(
      { success: true, variants: productVariants },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
        },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memuat data varian';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

