/**
 * Sanitiza un string para convertirlo en un slug seguro para URLs y nombres de archivo.
 * Convierte acentos, elimina caracteres especiales y reemplaza espacios por guiones.
 */
export function slugify(text: string): string {
  if (!text) return 'producto-sin-nombre';

  const cleaned = text
    .toString()
    .normalize('NFD') // Descompone caracteres con tildes (á -> a + ´)
    .replace(/[\u0300-\u036f]/g, '') // Elimina diacríticos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-_]/g, '') // Remueve caracteres no alfanuméricos excepto guión y guión bajo
    .replace(/[\s_]+/g, '-') // Reemplaza espacios y guiones bajos por guiones
    .replace(/-+/g, '-') // Colapsa guiones consecutivos
    .replace(/^-+|-+$/g, ''); // Quita guiones iniciales y finales

  return cleaned || 'producto-sin-nombre';
}

/**
 * Genera un identificador único corto aleatorio (ej. 4-6 caracteres hex).
 */
export function generateShortHash(length: number = 6): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Opciones para generar un nombre de archivo optimizado.
 */
export interface GenerateFilenameOptions {
  title: string;
  category?: string;
  sku?: string;
  extension?: string; // Default: 'webp'
  includeDate?: boolean;
  includeHash?: boolean;
  baseFolder?: string;
}

/**
 * Genera un nombre de archivo normalizado y estructurado para catálogos.
 * Ejemplo: "calzado/zapato-cuero-negro-20261105-a8f3.webp"
 */
export function generateCatalogFilename(options: GenerateFilenameOptions): {
  filename: string;
  fullPath: string;
  category: string;
} {
  const ext = (options.extension || 'webp').replace(/^\./, '');
  const titleSlug = slugify(options.title || 'producto');
  const categorySlug = slugify(options.category || 'general');
  const skuSlug = options.sku ? slugify(options.sku) : '';

  const parts: string[] = [];

  if (skuSlug) {
    parts.push(skuSlug);
  }
  parts.push(titleSlug);

  if (options.includeDate !== false) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    parts.push(dateStr);
  }

  if (options.includeHash !== false) {
    parts.push(generateShortHash(4));
  }

  const filename = `${parts.join('-')}.${ext}`;
  const baseFolder = options.baseFolder ? options.baseFolder.replace(/^\/+|\/+$/g, '') : '';

  let fullPath = filename;
  if (categorySlug && categorySlug !== 'general') {
    fullPath = `${categorySlug}/${filename}`;
  }
  if (baseFolder) {
    fullPath = `${baseFolder}/${fullPath}`;
  }

  return {
    filename,
    fullPath,
    category: categorySlug,
  };
}
