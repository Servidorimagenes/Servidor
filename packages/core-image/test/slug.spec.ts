import { describe, it, expect } from 'vitest';
import { slugify, generateShortHash, generateCatalogFilename } from '../src/slug.js';

describe('slug utility', () => {
  it('converts accented characters and spaces into clean slugs', () => {
    expect(slugify('Camisa Clásica de Algodón Óptimo')).toBe('camisa-clasica-de-algodon-optimo');
    expect(slugify('ZAPATO DEPORTIVO #42 / AZUL!')).toBe('zapato-deportivo-42-azul');
    expect(slugify('Café & Té - 100% Orgánico')).toBe('cafe-te-100-organico');
  });

  it('handles empty or special strings gracefully', () => {
    expect(slugify('')).toBe('producto-sin-nombre');
    expect(slugify('   ---   ')).toBe('producto-sin-nombre');
  });

  it('generates short random hashes of specified length', () => {
    const hash4 = generateShortHash(4);
    const hash8 = generateShortHash(8);
    expect(hash4).toHaveLength(4);
    expect(hash8).toHaveLength(8);
    expect(hash4).toMatch(/^[0-9a-f]{4}$/);
  });

  it('generates structured catalog filenames with categories and paths', () => {
    const res = generateCatalogFilename({
      title: 'Reloj Cronógrafo Deportivo',
      category: 'Accesorios y Relojes',
      sku: 'SKU-9921',
      extension: 'webp',
      includeDate: false,
      includeHash: false,
      baseFolder: 'catalogo-2026',
    });

    expect(res.category).toBe('accesorios-y-relojes');
    expect(res.filename).toBe('sku-9921-reloj-cronografo-deportivo.webp');
    expect(res.fullPath).toBe('catalogo-2026/accesorios-y-relojes/sku-9921-reloj-cronografo-deportivo.webp');
  });

  it('defaults to webp and general category when not provided', () => {
    const res = generateCatalogFilename({
      title: 'Pantalón Jean',
      includeDate: false,
      includeHash: false,
    });

    expect(res.category).toBe('general');
    expect(res.filename).toBe('pantalon-jean.webp');
    expect(res.fullPath).toBe('pantalon-jean.webp');
  });
});
