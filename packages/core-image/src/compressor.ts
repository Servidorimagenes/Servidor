import type { CompressionOptions, CompressionResult, ImageDimensions } from './types.js';

export const DEFAULT_COMPRESSION_OPTIONS: Required<CompressionOptions> = {
  maxDimension: 1000,
  quality: 0.78,
  format: 'image/webp',
  preserveAspectRatio: true,
};

/**
 * Calcula las nuevas dimensiones de la imagen manteniendo la relación de aspecto original
 * si excede el límite máximo especificado.
 */
export function calculateTargetDimensions(
  originalWidth: number,
  originalHeight: number,
  maxDimension: number = DEFAULT_COMPRESSION_OPTIONS.maxDimension
): ImageDimensions {
  if (originalWidth <= 0 || originalHeight <= 0) {
    return { width: 100, height: 100 };
  }

  // Si ambas dimensiones ya están dentro del límite, no agrandar
  if (originalWidth <= maxDimension && originalHeight <= maxDimension) {
    return { width: Math.round(originalWidth), height: Math.round(originalHeight) };
  }

  let width = originalWidth;
  let height = originalHeight;

  if (originalWidth > originalHeight) {
    if (originalWidth > maxDimension) {
      height = Math.round((originalHeight * maxDimension) / originalWidth);
      width = maxDimension;
    }
  } else {
    if (originalHeight > maxDimension) {
      width = Math.round((originalWidth * maxDimension) / originalHeight);
      height = maxDimension;
    }
  }

  return { width, height };
}

/**
 * Extrae la parte base64 pura de una cadena data URL (ej: "data:image/webp;base64,xxxx" -> "xxxx").
 */
export function extractRawBase64(dataUrlOrBase64: string): string {
  const commaIndex = dataUrlOrBase64.indexOf(',');
  if (commaIndex !== -1 && dataUrlOrBase64.slice(0, commaIndex).includes('base64')) {
    return dataUrlOrBase64.slice(commaIndex + 1);
  }
  return dataUrlOrBase64;
}

/**
 * Calcula el tamaño en bytes aproximado de una cadena base64.
 */
export function getBase64ByteSize(base64Str: string): number {
  const cleanBase64 = extractRawBase64(base64Str).replace(/[\r\n\s]/g, '');
  const padding = (cleanBase64.endsWith('==') ? 2 : cleanBase64.endsWith('=') ? 1 : 0);
  return Math.max(0, Math.floor((cleanBase64.length * 3) / 4) - padding);
}

/**
 * Comprime y redimensiona una imagen en el cliente (Browser HTML5 Canvas).
 * Admite File, Blob o ImageBitmap.
 */
export async function compressImageClient(
  fileOrBlob: Blob,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const opts = { ...DEFAULT_COMPRESSION_OPTIONS, ...options };
  const originalSize = fileOrBlob.size;

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('compressImageClient sólo está disponible en entornos de navegador con Canvas API.');
  }

  // Cargar imagen en un elemento Image
  const img = new Image();
  const objectUrl = URL.createObjectURL(fileOrBlob);

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('No se pudo decodificar el archivo de imagen.'));
    img.src = objectUrl;
  });

  try {
    const targetDims = calculateTargetDimensions(img.naturalWidth, img.naturalHeight, opts.maxDimension);

    const canvas = document.createElement('canvas');
    canvas.width = targetDims.width;
    canvas.height = targetDims.height;

    const ctx = canvas.getContext('2d', {
      alpha: opts.format === 'image/webp' || opts.format === 'image/png',
      willReadFrequently: false,
    });

    if (!ctx) {
      throw new Error('No se pudo inicializar el contexto 2D del Canvas.');
    }

    // Configurar suavizado de alta calidad para preservar nitidez
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Si el formato es JPEG, pintar fondo blanco para evitar transparencias negras
    if (opts.format === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0, targetDims.width, targetDims.height);

    // Exportar a Blob y DataUrl
    const dataUrl = canvas.toDataURL(opts.format, opts.quality);
    const rawBase64 = extractRawBase64(dataUrl);

    const compressedBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Error al generar el Blob de imagen comprimida.'));
        },
        opts.format,
        opts.quality
      );
    });

    const compressedSize = compressedBlob.size;
    const savingsPercent = originalSize > 0
      ? Number(Math.max(0, ((originalSize - compressedSize) / originalSize) * 100).toFixed(1))
      : 0;

    return {
      blob: compressedBlob,
      base64: rawBase64,
      dataUrl,
      originalSize,
      compressedSize,
      savingsPercent,
      dimensions: targetDims,
      mimeType: opts.format,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
