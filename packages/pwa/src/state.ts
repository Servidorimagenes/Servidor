import type { DirectLinks } from '@catalog/storage-github';

export interface AppConfig {
  provider: 'github' | 'gdrive';
  github: {
    owner: string;
    repo: string;
    branch: string;
    token: string;
    baseFolder: string;
  };
  gdrive: {
    accessToken: string;
    folderId: string;
  };
  maxDimension: number;
  quality: number;
}

export interface UploadHistoryItem {
  id: string;
  title: string;
  category: string;
  sku?: string;
  detail?: string;
  filename: string;
  originalSize: number;
  compressedSize: number;
  savingsPercent: number;
  cdnUrl: string;
  directLinks?: DirectLinks;
  timestamp: number;
  thumbnailUrl: string;
}

const STORAGE_KEY_CONFIG = 'catalog_img_config_v1';
const STORAGE_KEY_HISTORY = 'catalog_img_history_v1';

export const defaultConfig: AppConfig = {
  provider: 'github',
  github: {
    owner: '',
    repo: '',
    branch: 'main',
    token: '',
    baseFolder: 'productos',
  },
  gdrive: {
    accessToken: '',
    folderId: '',
  },
  maxDimension: 1000,
  quality: 0.78,
};

/**
 * Carga la configuración guardada del usuario.
 */
export function loadConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!raw) return defaultConfig;
    const parsed = JSON.parse(raw);
    return {
      ...defaultConfig,
      ...parsed,
      github: { ...defaultConfig.github, ...parsed.github },
      gdrive: { ...defaultConfig.gdrive, ...parsed.gdrive },
    };
  } catch (err) {
    console.error('Error cargando configuración:', err);
    return defaultConfig;
  }
}

/**
 * Guarda la configuración en localStorage.
 */
export function saveConfig(config: AppConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Error guardando configuración:', err);
  }
}

/**
 * Carga el historial de imágenes subidas.
 */
export function loadHistory(): UploadHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error cargando historial:', err);
    return [];
  }
}

/**
 * Agrega un elemento al inicio del historial de imágenes y persiste.
 */
export function addHistoryItem(item: UploadHistoryItem, maxItems = 100): UploadHistoryItem[] {
  const current = loadHistory();
  // Evitar duplicados por id
  const filtered = current.filter((h) => h.id !== item.id);
  const updated = [item, ...filtered].slice(0, maxItems);
  try {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error guardando historial:', err);
  }
  return updated;
}

/**
 * Limpia el historial de imágenes.
 */
export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_HISTORY);
  } catch (err) {
    console.error('Error limpiando historial:', err);
  }
}
