import { describe, it, expect, vi } from 'vitest';
import { uploadToGDrive } from '../src/gdrive-uploader.js';

describe('gdrive-uploader', () => {
  it('throws error if accessToken is missing', async () => {
    await expect(
      uploadToGDrive(
        { accessToken: '' },
        { filename: 'test.webp', base64Content: 'aGVsbG8=' }
      )
    ).rejects.toThrow('Se requiere un Google OAuth Access Token');
  });

  it('submits multipart payload and resolves direct link with fileId', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: '1AbCdEfGhIjKlMnOpQrStUvWxYz',
        name: 'zapato.webp',
        webViewLink: 'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/view',
      }),
    });

    const res = await uploadToGDrive(
      {
        accessToken: 'ya29.sample-token',
        folderId: '123_folder_id',
      },
      {
        filename: 'zapato.webp',
        mimeType: 'image/webp',
        base64Content: 'UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoAAP7/1/4=',
        description: 'Zapato deportivo azul',
      },
      mockFetch as any
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];

    expect(url).toContain('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');
    expect(options.headers['Authorization']).toBe('Bearer ya29.sample-token');
    expect(options.body).toContain('123_folder_id');
    expect(options.body).toContain('zapato.webp');

    expect(res.success).toBe(true);
    expect(res.fileId).toBe('1AbCdEfGhIjKlMnOpQrStUvWxYz');
    expect(res.directViewUrl).toBe('https://lh3.googleusercontent.com/d/1AbCdEfGhIjKlMnOpQrStUvWxYz');
    expect(res.warningNotice).toContain('Google Drive puede aplicar cuotas');
  });
});
