import { describe, it, expect, vi } from 'vitest';
import { uploadToGitHub } from '../src/github-uploader.js';

describe('github-uploader', () => {
  it('throws error if owner or repo is missing', async () => {
    await expect(
      uploadToGitHub(
        { owner: '', repo: 'my-repo', token: 'token123' },
        { path: 'test.webp', base64Content: 'aGVsbG8=' }
      )
    ).rejects.toThrow('El propietario (owner) y repositorio (repo)');
  });

  it('throws error if token is missing', async () => {
    await expect(
      uploadToGitHub(
        { owner: 'user', repo: 'my-repo', token: '' },
        { path: 'test.webp', base64Content: 'aGVsbG8=' }
      )
    ).rejects.toThrow('Se requiere un Token Personal');
  });

  it('sends correct payload to GitHub REST API and returns direct links', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        content: {
          name: 'camisa.webp',
          path: 'ropa/camisa.webp',
          sha: '6dcb09b5b57875f334f61aebed695e2e4193db5e',
          download_url: 'https://raw.githubusercontent.com/mi-usuario/repo/main/ropa/camisa.webp',
        },
        commit: {
          sha: '763842c98d01b33',
          html_url: 'https://github.com/mi-usuario/repo/commit/763842c98d01b33',
        },
      }),
    });

    const result = await uploadToGitHub(
      {
        owner: 'mi-usuario',
        repo: 'mi-catalogo',
        branch: 'main',
        token: 'ghp_secretToken12345',
        baseFolder: 'imagenes',
      },
      {
        path: 'ropa/camisa.webp',
        base64Content: 'aGVsbG8gd29ybGQ=',
        commitMessage: 'Subir nueva camisa para catálogo',
      },
      mockFetch as any
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [callUrl, callOptions] = mockFetch.mock.calls[0];

    expect(callUrl).toBe('https://api.github.com/repos/mi-usuario/mi-catalogo/contents/imagenes/ropa/camisa.webp');
    expect(callOptions.method).toBe('PUT');
    expect(callOptions.headers['Authorization']).toBe('Bearer ghp_secretToken12345');

    const parsedBody = JSON.parse(callOptions.body);
    expect(parsedBody.message).toBe('Subir nueva camisa para catálogo');
    expect(parsedBody.content).toBe('aGVsbG8gd29ybGQ=');
    expect(parsedBody.branch).toBe('main');

    expect(result.success).toBe(true);
    expect(result.sha).toBe('6dcb09b5b57875f334f61aebed695e2e4193db5e');
    expect(result.cdnUrl).toBe('https://cdn.jsdelivr.net/gh/mi-usuario/mi-catalogo@main/imagenes/ropa/camisa.webp');
    expect(result.directLinks.jsdelivr).toBe('https://cdn.jsdelivr.net/gh/mi-usuario/mi-catalogo@main/imagenes/ropa/camisa.webp');
  });

  it('handles 401 unauthorized errors with clear message', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Bad credentials' }),
    });

    await expect(
      uploadToGitHub(
        { owner: 'user', repo: 'repo', token: 'invalid_token' },
        { path: 'test.webp', base64Content: 'aGVsbG8=' },
        mockFetch as any
      )
    ).rejects.toThrow('Token de GitHub no válido');
  });
});
