import type { GitHubStorageConfig, UploadImageInput, UploadImageResult } from './types.js';
import { buildDirectLinks, normalizeRepoPath } from './cdn-resolver.js';

export interface GitHubApiContentResponse {
  content?: {
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string;
    download_url: string;
  };
  commit?: {
    sha: string;
    html_url: string;
  };
  message?: string;
}

/**
 * Sube una imagen en formato base64 directamente a un repositorio de GitHub
 * utilizando la API REST v3 de GitHub (Contents API).
 */
export async function uploadToGitHub(
  config: GitHubStorageConfig,
  input: UploadImageInput,
  fetchFn: typeof fetch = fetch
): Promise<UploadImageResult> {
  if (!config.owner || !config.repo) {
    throw new Error('El propietario (owner) y repositorio (repo) de GitHub son obligatorios.');
  }
  if (!config.token) {
    throw new Error('Se requiere un Token Personal de Acceso (PAT) de GitHub para autorizar la subida.');
  }

  const branch = config.branch || 'main';
  const cleanPath = normalizeRepoPath(
    config.baseFolder ? `${config.baseFolder}/${input.path}` : input.path
  );

  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${cleanPath}`;

  const message = input.commitMessage || `Subir imagen de catálogo: ${cleanPath}`;

  const bodyPayload: Record<string, any> = {
    message,
    content: input.base64Content.replace(/[\r\n\s]/g, ''),
    branch,
  };

  if (input.sha) {
    bodyPayload.sha = input.sha;
  }

  if (config.committer) {
    bodyPayload.committer = config.committer;
  }

  const response = await fetchFn(url, {
    method: 'PUT',
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `Bearer ${config.token.trim()}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Catalog-Image-Server-PWA/1.0',
    },
    body: JSON.stringify(bodyPayload),
  });

  const data: GitHubApiContentResponse = await response.json();

  if (!response.ok) {
    let errorMessage = data.message || `Error HTTP ${response.status} al subir a GitHub`;
    if (response.status === 401) {
      errorMessage = 'Token de GitHub no válido o expirado. Revisa tu Personal Access Token.';
    } else if (response.status === 404) {
      errorMessage = `Repositorio "${config.owner}/${config.repo}" no encontrado. Verifica nombre o permisos del token.`;
    } else if (response.status === 409) {
      errorMessage = 'Conflicto: el archivo ya existe o la rama está desactualizada.';
    }
    throw new Error(errorMessage);
  }

  const directLinks = buildDirectLinks(
    { owner: config.owner, repo: config.repo, branch },
    cleanPath
  );

  return {
    success: true,
    path: cleanPath,
    sha: data.content?.sha || '',
    cdnUrl: directLinks.jsdelivr,
    directLinks,
    downloadUrl: data.content?.download_url,
    commitUrl: data.commit?.html_url,
  };
}
