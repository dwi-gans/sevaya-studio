import { supabase } from './client';

export interface StorageFile {
  name: string;
  url: string;
  size?: number;
  createdAt?: string;
}

/**
 * Uploads an image or asset file to Supabase Storage.
 * Uses the secure server-side admin upload endpoint with fallback to client.
 */
export async function uploadFileToStorage(file: File, folder = 'uploads'): Promise<string> {
  // Try secure server-side upload first (bypasses RLS with service role)
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.url) {
        return data.url;
      }
    }
  } catch {
    // fallback to client-side
  }

  // Fallback: client-side Supabase upload
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${folder}/${Date.now()}_${cleanName}`;

  const { error } = await supabase.storage.from('catalog').upload(fileName, file, {
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
  const formData = new FormData();
  formData.append('folder', folder);
  formData.append('collection', collection);

  for (const file of files) {
    formData.append('files', file);
  }

  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Gagal mengunggah berkas ke Cloud Storage');
  }

  return data;
}

/**
 * Lists all uploaded files in the 'catalog' bucket under a specific folder.
 */
export async function listUploadedFiles(folder = 'uploads'): Promise<StorageFile[]> {
  // Try server endpoint first
  try {
    const res = await fetch(`/api/admin/upload?folder=${encodeURIComponent(folder)}`);
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
 * Deletes a file from Supabase storage by path.
 */
export async function deleteFileFromStorage(filePath: string): Promise<boolean> {
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
