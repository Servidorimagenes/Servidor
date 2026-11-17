import { describe, it, expect } from 'vitest';
import { buildDirectLinks, normalizeRepoPath } from '../src/cdn-resolver.js';

describe('cdn-resolver', () => {
  it('normalizes paths with multiple or leading slashes', () => {
    expect(normalizeRepoPath('///catalog//shoes/boot.webp///')).toBe('catalog/shoes/boot.webp');
  });

  it('builds valid jsDelivr, Statically, Raw, and GitHub Pages URLs', () => {
    const links = buildDirectLinks(
      {
        owner: 'acme-corp',
        repo: 'sales-catalog',
        branch: 'main',
      },
      'calzado/zapato-azul.webp',
      'Zapato Azul'
    );

    expect(links.jsdelivr).toBe('https://cdn.jsdelivr.net/gh/acme-corp/sales-catalog@main/calzado/zapato-azul.webp');
    expect(links.statically).toBe('https://cdn.statically.io/gh/acme-corp/sales-catalog/main/calzado/zapato-azul.webp');
    expect(links.raw).toBe('https://raw.githubusercontent.com/acme-corp/sales-catalog/main/calzado/zapato-azul.webp');
    expect(links.githubPages).toBe('https://acme-corp.github.io/sales-catalog/calzado/zapato-azul.webp');
    expect(links.markdownSnippet).toBe('![Zapato Azul](https://cdn.jsdelivr.net/gh/acme-corp/sales-catalog@main/calzado/zapato-azul.webp)');
    expect(links.htmlSnippet).toContain('loading="lazy"');
  });
});
