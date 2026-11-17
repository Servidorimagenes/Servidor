import { describe, it, expect } from 'vitest';
import {
  calculateTargetDimensions,
  extractRawBase64,
  getBase64ByteSize,
} from '../src/compressor.js';

describe('compressor calculations', () => {
  it('resizes landscape image to max dimension while preserving aspect ratio', () => {
    // 4000 x 2000 image with maxDimension 1000
    const dims = calculateTargetDimensions(4000, 2000, 1000);
    expect(dims.width).toBe(1000);
    expect(dims.height).toBe(500);
  });

  it('resizes portrait image to max dimension while preserving aspect ratio', () => {
    // 3000 x 6000 image with maxDimension 1000
    const dims = calculateTargetDimensions(3000, 6000, 1000);
    expect(dims.width).toBe(500);
    expect(dims.height).toBe(1000);
  });

  it('does not upscale images that are already smaller than maxDimension', () => {
    const dims = calculateTargetDimensions(640, 480, 1000);
    expect(dims.width).toBe(640);
    expect(dims.height).toBe(480);
  });

  it('handles square images properly', () => {
    const dims = calculateTargetDimensions(2400, 2400, 800);
    expect(dims.width).toBe(800);
    expect(dims.height).toBe(800);
  });

  it('extracts raw base64 data correctly', () => {
    const dataUrl = 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoAAP7/1/4=';
    const raw = extractRawBase64(dataUrl);
    expect(raw).toBe('UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoAAP7/1/4=');
    expect(extractRawBase64('plainBase64String123')).toBe('plainBase64String123');
  });

  it('computes byte size accurately from base64 string', () => {
    // "hello" base64 is "aGVsbG8=" (5 bytes)
    const size = getBase64ByteSize('aGVsbG8=');
    expect(size).toBe(5);
  });
});
