import { supabase } from './client';

export interface StorageFile {
  name: string;
  url: string;
  size?: number;
  createdAt?: string;
}

/**
 * Uploads an image or asset file to the public Supabase 'catalog' bucket.
 * Returns the public URL of the uploaded asset.
 */
export async function uploadFileToStorage(file: File, folder = 'uploads'): Promise<string> {
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
 * Lists all uploaded files in the 'catalog' bucket under a specific folder.
 */
export async function listUploadedFiles(folder = 'uploads'): Promise<StorageFile[]> {
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
