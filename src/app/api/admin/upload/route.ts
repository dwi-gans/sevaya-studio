import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/auth-server';
import { verifyAdminSession } from '@/lib/auth-admin';
import sharp from 'sharp';

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
    const isDev = process.env.NODE_ENV !== 'production';
    const authHeader = req.headers.get('x-admin-key');
    const isLocalAdmin = authHeader === 'sevaya-admin' || isDev;
    const session = verifyAdminSession(req);

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

    const totalBytes = data.reduce((acc, item) => acc + (item.metadata?.size || 0), 0);
    const maxQuotaGb = Number(process.env.SUPABASE_STORAGE_MAX_GB) || 1;
    const maxBytes = maxQuotaGb * 1024 * 1024 * 1024;
    const percentUsed = Math.min(100, Math.max(0.1, Number(((totalBytes / maxBytes) * 100).toFixed(1))));

    const storageStats = {
      totalBytes,
      formattedSize: formatBytes(totalBytes),
      maxBytes,
      maxFormatted: `${maxQuotaGb} GB`,
      percentUsed,
      fileCount: files.length,
    };

    return NextResponse.json({ success: true, files, storageStats });
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
    const isDev = process.env.NODE_ENV !== 'production';
    const authHeader = req.headers.get('x-admin-key');
    const isLocalAdmin = authHeader === 'sevaya-admin' || isDev;
    const session = verifyAdminSession(req);

    // Admin check: allow if valid session or local admin header / dev
    if (!session && !isLocalAdmin) {
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
      let cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const arrayBuffer = await file.arrayBuffer();
      let buffer = Buffer.from(arrayBuffer);

      // Robust Content-Type detection for Mac / Safari / HEIC / video / generic octet-stream
      let detectedContentType = file.type;
      if (!detectedContentType || detectedContentType === 'application/octet-stream') {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        if (ext === 'png') detectedContentType = 'image/png';
        else if (ext === 'webp') detectedContentType = 'image/webp';
        else if (ext === 'gif') detectedContentType = 'image/gif';
        else if (ext === 'avif') detectedContentType = 'image/avif';
        else if (ext === 'svg') detectedContentType = 'image/svg+xml';
        else if (ext === 'heic' || ext === 'heif') detectedContentType = 'image/heic';
        else if (ext === 'mp4' || ext === 'm4v') detectedContentType = 'video/mp4';
        else if (ext === 'webm') detectedContentType = 'video/webm';
        else if (ext === 'mov') detectedContentType = 'video/quicktime';
        else if (file.type && file.type.startsWith('video/')) detectedContentType = file.type;
        else detectedContentType = 'image/jpeg';
      }

      // Server-side WebP optimization safety-net:
      // Converts any raster image (JPEG, PNG, HEIC, TIFF, large WebP) to clean WebP (Q85, max 2400px)
      const isRasterImage =
        (detectedContentType.startsWith('image/') || /\.(jpe?g|png|webp|avif|heic|heif|bmp|tiff)$/i.test(file.name)) &&
        detectedContentType !== 'image/svg+xml' &&
        detectedContentType !== 'image/gif';

      // Avoid lossy generation loss if client already compressed it into a lightweight WebP
      const isAlreadyOptimizedWebp =
        detectedContentType === 'image/webp' &&
        buffer.length <= 800 * 1024 &&
        cleanName.toLowerCase().endsWith('.webp');

      if (isRasterImage && !isAlreadyOptimizedWebp) {
        try {
          const webpBuffer = await sharp(buffer)
            .rotate() // auto-orient based on EXIF
            .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 85, effort: 4, smartSubsample: true })
            .toBuffer();

          buffer = webpBuffer;
          detectedContentType = 'image/webp';
          const lastDot = cleanName.lastIndexOf('.');
          const base = lastDot > 0 ? cleanName.substring(0, lastDot) : cleanName;
          cleanName = `${base}.webp`;
        } catch (sharpErr) {
          console.warn('Sharp optimization skipped for', file.name, sharpErr);
        }
      }

      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const filePath = `${folder}/${timestamp}_${randomSuffix}_${cleanName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('catalog')
        .upload(filePath, buffer, {
          contentType: detectedContentType,
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

      const ext = cleanName.split('.').pop()?.toUpperCase() || 'WEBP';
      const formattedDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' WIB';

      uploadedAssets.push({
        filename: cleanName,
        storagePath: filePath,
        collection,
        size: formatBytes(buffer.length),
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

/**
 * DELETE /api/admin/upload — Delete a file from Supabase Storage using admin privileges
 */
export async function DELETE(req: NextRequest) {
  try {
    const isDev = process.env.NODE_ENV !== 'production';
    const authHeader = req.headers.get('x-admin-key');
    const isLocalAdmin = authHeader === 'sevaya-admin' || isDev;
    const session = verifyAdminSession(req);
    if (!session && !isLocalAdmin) {
      return NextResponse.json(
        { success: false, error: 'Sesi admin tidak valid. Silakan login kembali.' },
        { status: 401 }
      );
    }

    let filePath = req.nextUrl.searchParams.get('path');
    if (!filePath) {
      try {
        const body = await req.json();
        filePath = body.path || body.url || body.filename;
      } catch {
        // ignore
      }
    }

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'Path atau URL berkas tidak diberikan.' },
        { status: 400 }
      );
    }

    // Clean path to extract relative path within 'catalog' bucket
    // e.g. https://.../storage/v1/object/public/catalog/uploads/xxx.jpg -> uploads/xxx.jpg
    let cleanPath = filePath;
    if (cleanPath.includes('/catalog/')) {
      cleanPath = cleanPath.split('/catalog/')[1] || cleanPath;
    }
    // Remove query params or leading slashes
    cleanPath = (cleanPath.split('?')[0] || cleanPath).replace(/^\/+/, '');

    // If it's just a filename with no folder, assume 'uploads/'
    if (!cleanPath.includes('/')) {
      cleanPath = `uploads/${cleanPath}`;
    }

    const { data, error } = await supabaseAdmin.storage
      .from('catalog')
      .remove([cleanPath]);

    if (error) {
      console.error('Supabase admin delete error:', error);
      return NextResponse.json(
        { success: false, error: `Gagal menghapus dari storage: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Berkas berhasil dihapus dari Cloud Storage.',
      deleted: data,
    });
  } catch (err: unknown) {
    console.error('Admin delete handler error:', err);
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat menghapus berkas.';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
