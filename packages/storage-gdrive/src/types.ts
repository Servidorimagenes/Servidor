export interface GDriveConfig {
  /**
   * OAuth 2.0 Access Token de Google con scope 'https://www.googleapis.com/auth/drive.file'
   */
  accessToken: string;

  /**
   * ID de la carpeta en Google Drive donde almacenar las fotos de catálogo (opcional)
   */
  folderId?: string;
}

export interface GDriveUploadInput {
  filename: string;
  mimeType?: string;
  base64Content: string;
  description?: string;
}

export interface GDriveUploadResult {
  success: boolean;
  fileId: string;
  name: string;
  /**
   * Enlace directo (googleusercontent) para visualización
   */
  directViewUrl: string;
  /**
   * Enlace de vista estándar de Drive
   */
  webViewUrl: string;
  /**
   * Advertencia de limitación de Google Drive para catálogos de alta concurrencia
   */
  warningNotice?: string;
}
