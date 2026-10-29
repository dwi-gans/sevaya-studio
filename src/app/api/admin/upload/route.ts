import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/auth-server';
import { verifyAdminSession } from '@/lib/auth-admin';

export const runtime = 'nodejs';

/**
 * Format bytes to readable size (e.g. 2.4 MB)
 */
function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * GET /api/admin/upload — List uploaded files in the 'catalog' bucket
 */
export async function GET(req: NextRequest) {
  try {
    const session = verifyAdminSession(req);
    // Allow reading if admin session is valid, or fallback to read public
    const folder = req.nextUrl.searchParams.get('folder') || 'uploads';

    const { data, error } = await supabaseAdmin.storage.from('catalog').list(folder, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    if (error || !data) {
      return NextResponse.json({ success: true, files: [] });
    }

    const files = data
      .filter((item) => item.name !== '.emptyFolderPlaceholder')
      .map((item) => {
        const fullPath = `${folder}/${item.name}`;
        const {
          data: { publicUrl },
        } = supabaseAdmin.storage.from('catalog').getPublicUrl(fullPath);

        const ext = item.name.split('.').pop()?.toUpperCase() || 'JPG';
        const formattedDate = item.created_at
          ? new Date(item.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }) + ' WIB'
          : 'Baru saja';

        return {
          filename: item.name,
          collection: 'Master Upload Cloud CDN',
          size: formatBytes(item.metadata?.size || 0),
          res: '4K High-Res',
          format: `${ext} Master`,
          date: formattedDate,
          cdnUrl: publicUrl,
          src: publicUrl,
          badge: 'LIVE PDP',
          isMaster: true,
          category: 'all',
          createdAt: item.created_at,
        };
      });

    return NextResponse.json({ success: true, files });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memuat berkas';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * POST /api/admin/upload — Upload single or multiple files to Supabase Storage
 */
export async function POST(req: NextRequest) {
  try {
    const session = verifyAdminSession(req);
    // Admin check: if user has no session, reject
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesi admin tidak valid. Silakan login kembali.' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const folder = (formData.get('folder') as string) || 'uploads';
    const collection = (formData.get('collection') as string) || 'Master Upload Cloud CDN';

    // Collect all files from 'files' or 'file' field
    const rawFiles = [
      ...formData.getAll('files'),
      ...formData.getAll('file'),
    ].filter((f): f is File => f instanceof File && f.size > 0);

    if (rawFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada file yang diunggah.' },
        { status: 400 }
      );
    }

    const uploadedAssets = [];

    for (const file of rawFiles) {
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const filePath = `${folder}/${timestamp}_${randomSuffix}_${cleanName}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabaseAdmin.storage
        .from('catalog')
        .upload(filePath, buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: true,
          cacheControl: '31536000', // 1 year immutable for CDN
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw new Error(`Upload ${file.name} gagal: ${uploadError.message}`);
      }

      const {
        data: { publicUrl },
      } = supabaseAdmin.storage.from('catalog').getPublicUrl(filePath);

      const ext = file.name.split('.').pop()?.toUpperCase() || 'JPG';
      const formattedDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' WIB';

      uploadedAssets.push({
        filename: file.name,
        storagePath: filePath,
        collection,
        size: formatBytes(file.size),
        res: '4K High-Res',
        format: `${ext} Master`,
        date: formattedDate,
        cdnUrl: publicUrl,
        src: publicUrl,
        badge: 'LIVE PDP' as const,
        isMaster: true,
        category: 'all' as const,
      });
    }

    return NextResponse.json({
      success: true,
      message: `${uploadedAssets.length} file berhasil diunggah ke Supabase Cloud!`,
      files: uploadedAssets,
      urls: uploadedAssets.map((a) => a.src),
      url: uploadedAssets[0]?.src || '',
    });
  } catch (err: unknown) {
    console.error('Admin upload handler error:', err);
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengunggah berkas.';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
