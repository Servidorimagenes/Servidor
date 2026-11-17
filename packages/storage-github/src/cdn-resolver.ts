import type { DirectLinks, GitHubStorageConfig } from './types.js';

/**
 * Normaliza una ruta eliminando barras inclinadas duplicadas o iniciales.
 */
export function normalizeRepoPath(path: string): string {
  return path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');
}

/**
 * Genera el mapa completo de enlaces CDN directos y snippets a partir de los datos de repo y ruta.
 */
export function buildDirectLinks(
  config: Pick<GitHubStorageConfig, 'owner' | 'repo' | 'branch'>,
  filePath: string,
  altText: string = 'Producto'
): DirectLinks {
  const owner = encodeURIComponent(config.owner.trim());
  const repo = encodeURIComponent(config.repo.trim());
  const branch = encodeURIComponent((config.branch || 'main').trim());
  const cleanPath = normalizeRepoPath(filePath);

  // jsDelivr CDN
  const jsdelivr = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${cleanPath}`;

  // Statically CDN
  const statically = `https://cdn.statically.io/gh/${owner}/${repo}/${branch}/${cleanPath}`;

  // Raw GitHub
  const raw = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${cleanPath}`;

  // GitHub Pages
  const githubPages = `https://${owner.toLowerCase()}.github.io/${repo}/${cleanPath}`;

  const markdownSnippet = `![${altText}](${jsdelivr})`;
  const htmlSnippet = `<img src="${jsdelivr}" alt="${altText}" loading="lazy" width="800" height="800" />`;

  return {
    jsdelivr,
    statically,
    raw,
    githubPages,
    markdownSnippet,
    htmlSnippet,
  };
}
