export interface ImageDimensions {
  width: number;
  height: number;
}

export interface CompressionOptions {
  /**
   * Maximum dimension (width or height) in pixels.
   * Default: 1000
   */
  maxDimension?: number;

  /**
   * Compression quality (0.0 to 1.0).
   * Default: 0.78
   */
  quality?: number;

  /**
   * Output mime type.
   * Default: 'image/webp'
   */
  format?: 'image/webp' | 'image/jpeg' | 'image/png';

  /**
   * Retain aspect ratio during resize.
   * Default: true
   */
  preserveAspectRatio?: boolean;
}

export interface CompressionResult {
  /**
   * Compressed Blob (in browser environment).
   */
  blob?: Blob;

  /**
   * Base64 data string (clean, without data URL prefix if needed for API).
   */
  base64: string;

  /**
   * Complete Data URL (data:image/webp;base64,...).
   */
  dataUrl: string;

  /**
   * Original image size in bytes.
   */
  originalSize: number;

  /**
   * Compressed image size in bytes.
   */
  compressedSize: number;

  /**
   * Percentage saved (e.g. 85.4).
   */
  savingsPercent: number;

  /**
   * Output dimensions after resize.
   */
  dimensions: ImageDimensions;

  /**
   * Output mime type.
   */
  mimeType: string;
}

export interface ImageMetadata {
  title: string;
  category?: string;
  sku?: string;
  detail?: string;
  createdAt: string;
  filename: string;
}
