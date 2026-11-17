import type { GDriveConfig, GDriveUploadInput, GDriveUploadResult } from './types.js';

/**
 * Convierte base64 a Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64.replace(/[\r\n\s]/g, ''));
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Sube un archivo a Google Drive mediante la API v3 Multipart Upload.
 */
export async function uploadToGDrive(
  config: GDriveConfig,
  input: GDriveUploadInput,
  fetchFn: typeof fetch = fetch
): Promise<GDriveUploadResult> {
  if (!config.accessToken) {
    throw new Error('Se requiere un Google OAuth Access Token para subir archivos a Google Drive.');
  }

  const mimeType = input.mimeType || 'image/webp';
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata: Record<string, any> = {
    name: input.filename,
    mimeType,
    description: input.description || 'Imagen de catálogo subida desde PWA',
  };

  if (config.folderId) {
    metadata.parents = [config.folderId];
  }

  // Prepara cuerpo multipart
  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
  const mediaHeader = `${delimiter}Content-Type: ${mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n`;
  const cleanBase64 = input.base64Content.replace(/[\r\n\s]/g, '');

  const multipartRequestBody = `${metadataPart}${mediaHeader}${cleanBase64}${closeDelimiter}`;

  const response = await fetchFn(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken.trim()}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Error en Google Drive API (${response.status}): ${data.error?.message || response.statusText}`);
  }

  const fileId = data.id;

  // Enlace directo en el CDN de Google (lh3.googleusercontent.com/d/ID)
  const directViewUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
  const webViewUrl = data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;

  return {
    success: true,
    fileId,
    name: data.name || input.filename,
    directViewUrl,
    webViewUrl,
    warningNotice: 'Nota: Google Drive puede aplicar cuotas de visualización y bloqueo CORS en catálogos de alta concurrencia. Recomendamos GitHub + jsDelivr para producción.',
  };
}
