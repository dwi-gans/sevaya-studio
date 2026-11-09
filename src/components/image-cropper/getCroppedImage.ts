/**
 * Utilitas canvas murni untuk memotong gambar berdasarkan koordinat piksel.
 * Tanpa logika bisnis — tidak tahu apa pun soal Supabase, hero, atau produk.
 *
 * Menangani orientasi EXIF dari foto HP secara otomatis.
 */

export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CroppedImageResult {
  blob: Blob;
  file: File;
  width: number;
  height: number;
  dataUrl: string;
}

/**
 * Membaca orientasi EXIF dari ArrayBuffer JPEG/WEBP.
 * Mengembalikan derajat rotasi yang perlu dikoreksi (0 | 90 | 180 | 270).
 */
function getExifRotation(buffer: ArrayBuffer): 0 | 90 | 180 | 270 {
  const view = new DataView(buffer);
  if (view.getUint16(0, false) !== 0xffd8) return 0; // bukan JPEG

  const length = view.byteLength;
  let offset = 2;

  while (offset < length) {
    if (view.getUint16(offset, false) !== 0xffe1) {
      offset += 2 + view.getUint16(offset + 2, false);
      continue;
    }
    offset += 4;
    if (view.getUint32(offset, false) !== 0x45786966) return 0; // bukan "Exif"
    offset += 6;

    const little = view.getUint16(offset, false) === 0x4949;
    offset += view.getUint32(offset + 4, little);

    const tags = view.getUint16(offset, little);
    offset += 2;

    for (let i = 0; i < tags; i++) {
      if (view.getUint16(offset + i * 12, little) === 0x0112) {
        const orientation = view.getUint16(offset + i * 12 + 8, little);
        if (orientation === 3) return 180;
        if (orientation === 6) return 90;
        if (orientation === 8) return 270;
        return 0;
      }
    }
    return 0;
  }
  return 0;
}

/**
 * Memuat gambar dari URL/objectURL ke HTMLImageElement.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Gagal memuat gambar'));
    img.src = src;
  });
}

/**
 * Mengekspor area crop dari gambar asli ke Blob/File.
 *
 * @param imageSrc    - objectURL gambar asli
 * @param pixelCrop   - koordinat piksel pada gambar asli (dari react-easy-crop)
 * @param rotation    - rotasi tambahan yang diterapkan user (derajat)
 * @param originalFile - file asli (untuk nama dan tipe)
 * @param outputMaxWidth - batas lebar output (px)
 * @param outputFormat   - format output
 * @param quality        - kualitas 0–1
 */
export async function getCroppedImage(
  imageSrc: string,
  pixelCrop: PixelCrop,
  rotation: number,
  originalFile: File | string,
  outputMaxWidth: number,
  outputFormat: 'image/webp' | 'image/jpeg' = 'image/webp',
  quality = 0.98,
): Promise<CroppedImageResult> {
  // Koreksi EXIF (hanya untuk File fisik)
  let exifDeg: 0 | 90 | 180 | 270 = 0;
  if (originalFile instanceof File) {
    try {
      const buf = await originalFile.arrayBuffer();
      exifDeg = getExifRotation(buf);
    } catch {
      // abaikan jika gagal baca EXIF
    }
  }

  const image = await loadImage(imageSrc);

  const totalRotation = ((rotation + exifDeg) % 360 + 360) % 360;
  const radians = (totalRotation * Math.PI) / 180;

  // Canvas untuk merotasi gambar penuh dulu
  const rotCanvas = document.createElement('canvas');
  const rotCtx = rotCanvas.getContext('2d');
  if (!rotCtx) throw new Error('Canvas tidak tersedia');

  // Aktifkan smoothing kualitas tertinggi agar gambar tetap tajam (anti-burik)
  rotCtx.imageSmoothingEnabled = true;
  rotCtx.imageSmoothingQuality = 'high';

  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  rotCanvas.width = Math.round(image.width * cos + image.height * sin);
  rotCanvas.height = Math.round(image.width * sin + image.height * cos);

  rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
  rotCtx.rotate(radians);
  rotCtx.drawImage(image, -image.width / 2, -image.height / 2);

  // Canvas hasil crop
  const cropCanvas = document.createElement('canvas');
  const cropCtx = cropCanvas.getContext('2d');
  if (!cropCtx) throw new Error('Canvas tidak tersedia');

  // Aktifkan smoothing kualitas tertinggi pada canvas crop
  cropCtx.imageSmoothingEnabled = true;
  cropCtx.imageSmoothingQuality = 'high';

  // Resolusi Cerdas (Anti-Burik):
  // Jika crop berorientasi Landscape (Desktop 16:9), pastikan resolusi output minimal 1920x1080 (Full HD).
  // Jika sumber foto hanya 1024px (seperti foto katalog/WA), canvas akan melakukan upsampling bicubic
  // berkualitas tinggi ke 1920px sehingga tidak pecah saat dirender di layar laptop/PC.
  const isLandscape = pixelCrop.width / pixelCrop.height >= 1.3;
  let targetWidth = pixelCrop.width;

  if (isLandscape) {
    // Standar minimum Full HD untuk desktop landscape
    const minDesktopWidth = 1920;
    targetWidth = Math.min(outputMaxWidth, Math.max(minDesktopWidth, pixelCrop.width));
  } else {
    // Standar minimum untuk mobile portrait (9:16)
    const minMobileWidth = 1080;
    targetWidth = Math.min(outputMaxWidth, Math.max(minMobileWidth, pixelCrop.width));
  }

  const scale = targetWidth / pixelCrop.width;
  const outW = Math.round(pixelCrop.width * scale);
  const outH = Math.round(pixelCrop.height * scale);

  cropCanvas.width = outW;
  cropCanvas.height = outH;

  cropCtx.drawImage(
    rotCanvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outW,
    outH,
  );

  const dataUrl = cropCanvas.toDataURL(outputFormat, quality);

  const blob = await new Promise<Blob>((resolve, reject) => {
    cropCanvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Gagal mengekspor gambar'));
      },
      outputFormat,
      quality,
    );
  });

  // Pastikan ekstensi dan MIME type selalu cocok dengan tipe output blob yang sebenarnya
  const actualType = blob.type || outputFormat;
  const ext = actualType === 'image/webp' ? 'webp' : (actualType === 'image/png' ? 'png' : 'jpg');
  const baseName =
    originalFile instanceof File
      ? originalFile.name.replace(/\.[^.]+$/, '')
      : (typeof originalFile === 'string'
          ? (originalFile.split('/').pop()?.split('?')[0]?.replace(/\.[^.]+$/, '') || 'hero-cloud')
          : 'hero-image');
  const fileName = `${baseName}.${ext}`;

  const file = new File([blob], fileName, { type: actualType });

  return { blob, file, width: outW, height: outH, dataUrl };
}
