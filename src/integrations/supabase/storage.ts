import { supabase } from './client';

export interface StorageFile {
  name: string;
  url: string;
  size?: number;
  createdAt?: string;
}

/**
 * Automatically compresses images (JPEG, PNG, WEBP) in the browser before upload.
 * Reduces 3-8 MB raw camera/design images down to 100-300 KB WebP,
 * saving over 85-90% of Supabase Storage and bandwidth (Egress).
 */
export async function compressImageBeforeUpload(file: File): Promise<File> {
  if (typeof window === 'undefined') return file;
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }
  // If already small (< 200 KB), no need to compress further
  if (file.size < 200 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = document.createElement('img');
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX_DIMENSION = 2000;
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }
          const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          const compressedFile = new File([blob], `${baseName}.webp`, {
            type: 'image/webp',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        'image/webp',
        0.82
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

/**
 * Uploads an image or asset file to Supabase Storage.
 * Uses the secure server-side admin upload endpoint with fallback to client.
 */
export async function uploadFileToStorage(file: File, folder = 'uploads'): Promise<string> {
  const fileToUpload = typeof window !== 'undefined' ? await compressImageBeforeUpload(file) : file;

  // Try secure server-side upload first (bypasses RLS with service role)
  try {
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('folder', folder);

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: {
        'x-admin-key': 'sevaya-admin',
      },
      credentials: 'include',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.url) {
        // Sync cache so MediaLibraryTab & ImagePickerModal see this immediately
        if (typeof window !== 'undefined' && data.files && data.files.length > 0) {
          try {
            const cached = localStorage.getItem('sevaya_cloud_media_assets');
            const parsed = cached ? JSON.parse(cached) : [];
            const next = [...data.files, ...parsed];
            localStorage.setItem('sevaya_cloud_media_assets', JSON.stringify(next));
          } catch {
            // ignore
          }
        }
        return data.url;
      }
    }
  } catch {
    // fallback to client-side
  }

  // Fallback: client-side Supabase upload
  const cleanName = fileToUpload.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${folder}/${Date.now()}_${cleanName}`;

  const { error } = await supabase.storage.from('catalog').upload(fileName, fileToUpload, {
    cacheControl: '3600',
    upsert: true,
  });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('catalog').getPublicUrl(fileName);

  return publicUrl;
}

/**
 * Uploads multiple files at once to Supabase Storage via admin API.
 */
export async function uploadMultipleFilesToStorage(
  files: File[],
  folder = 'uploads',
  collection = 'Master Upload Cloud CDN'
): Promise<{ success: boolean; files: any[]; urls: string[] }> {
  const processedFiles =
    typeof window !== 'undefined'
      ? await Promise.all(files.map(compressImageBeforeUpload))
      : files;

  const formData = new FormData();
  formData.append('folder', folder);
  formData.append('collection', collection);

  for (const file of processedFiles) {
    formData.append('files', file);
  }

  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: {
      'x-admin-key': 'sevaya-admin',
    },
    credentials: 'include',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Gagal mengunggah berkas ke Cloud Storage');
  }

  // Sync cache so MediaLibraryTab & ImagePickerModal see this immediately
  if (typeof window !== 'undefined' && data.files && data.files.length > 0) {
    try {
      const cached = localStorage.getItem('sevaya_cloud_media_assets');
      const parsed = cached ? JSON.parse(cached) : [];
      const next = [...data.files, ...parsed];
      localStorage.setItem('sevaya_cloud_media_assets', JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  return data;
}

/**
 * Lists all uploaded files in the 'catalog' bucket under a specific folder.
 */
export async function listUploadedFiles(folder = 'uploads'): Promise<StorageFile[]> {
  // Try server endpoint first
  try {
    const res = await fetch(`/api/admin/upload?folder=${encodeURIComponent(folder)}`, {
      headers: {
        'x-admin-key': 'sevaya-admin',
      },
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.files)) {
        return data.files.map((f: any) => ({
          name: f.filename,
          url: f.src || f.cdnUrl,
          size: f.size,
          createdAt: f.createdAt,
        }));
      }
    }
  } catch {
    // fallback
  }

  try {
    const { data, error } = await supabase.storage.from('catalog').list(folder, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    if (error || !data) {
      return [];
    }

    return data
      .filter((item) => item.name !== '.emptyFolderPlaceholder')
      .map((item) => {
        const fullPath = `${folder}/${item.name}`;
        const {
          data: { publicUrl },
        } = supabase.storage.from('catalog').getPublicUrl(fullPath);
        return {
          name: item.name,
          url: publicUrl,
          size: item.metadata?.size,
          createdAt: item.created_at || undefined,
        };
      });
  } catch {
    return [];
  }
}

/**
 * Deletes a file from Supabase storage by path or URL.
 * Uses secure server admin endpoint to bypass storage RLS.
 */
export async function deleteFileFromStorage(filePath: string): Promise<boolean> {
  // Try secure server-side admin delete first
  try {
    const res = await fetch(`/api/admin/upload?path=${encodeURIComponent(filePath)}`, {
      method: 'DELETE',
      headers: {
        'x-admin-key': 'sevaya-admin',
      },
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return true;
      }
    }
  } catch {
    // fallback
  }

  try {
    const cleanPath = filePath.includes('/catalog/')
      ? filePath.split('/catalog/')[1] || filePath
      : filePath;
    const { error } = await supabase.storage.from('catalog').remove([cleanPath]);
    return !error;
  } catch {
    return false;
  }
}
