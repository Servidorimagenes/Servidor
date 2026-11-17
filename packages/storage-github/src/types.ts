export interface GitHubStorageConfig {
  /**
   * Usuario u organización de GitHub (ej: 'mi-empresa')
   */
  owner: string;

  /**
   * Nombre del repositorio (ej: 'imagenes-catalogo')
   */
  repo: string;

  /**
   * Rama de destino (default: 'main')
   */
  branch?: string;

  /**
   * Token personal de acceso (PAT) de GitHub con permiso repo o contents:write.
   */
  token: string;

  /**
   * Carpeta base opcional dentro del repo (ej: 'catalogo')
   */
  baseFolder?: string;

  /**
   * Información del committer (opcional)
   */
  committer?: {
    name: string;
    email: string;
  };
}

export interface UploadImageInput {
  /**
   * Ruta relativa destino en el repositorio (ej: 'calzado/zapato-azul.webp')
   */
  path: string;

  /**
   * Contenido del archivo en base64 (sin prefijo data URL)
   */
  base64Content: string;

  /**
   * Mensaje de commit personalizado (opcional)
   */
  commitMessage?: string;

  /**
   * SHA existente si se está sobreescribiendo un archivo
   */
  sha?: string;
}

export interface DirectLinks {
  /**
   * Enlace CDN global de alta velocidad jsDelivr (Recomendado para producción)
   * Formato: https://cdn.jsdelivr.net/gh/<owner>/<repo>@<branch>/<path>
   */
  jsdelivr: string;

  /**
   * Enlace CDN alternativo Statically
   * Formato: https://cdn.statically.io/gh/<owner>/<repo>/<branch>/<path>
   */
  statically: string;

  /**
   * Enlace crudo directo de GitHub (Back-up)
   * Formato: https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<path>
   */
  raw: string;

  /**
   * Enlace vía GitHub Pages (si el repo tiene GitHub Pages activado)
   * Formato: https://<owner>.github.io/<repo>/<path>
   */
  githubPages: string;

  /**
   * Snippet en formato Markdown listo para pegar
   * Formato: ![<title>](<jsdelivr_url>)
   */
  markdownSnippet: string;

  /**
   * Snippet en etiqueta HTML <img> lista para catálogos web
   */
  htmlSnippet: string;
}

export interface UploadImageResult {
  success: boolean;
  path: string;
  sha: string;
  cdnUrl: string;
  directLinks: DirectLinks;
  downloadUrl?: string;
  commitUrl?: string;
  error?: string;
}
