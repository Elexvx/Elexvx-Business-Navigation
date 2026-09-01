import { describe, expect, it } from 'vitest';

import { buildSeoArtifacts, buildSeoHead } from '../src/config/sitePlugin';
import { fixtureSiteConfig } from './fixtures';

describe('SEO generation', () => {
  it('builds one canonical URL and truthful social metadata', () => {
    const head = buildSeoHead(fixtureSiteConfig);

    expect(head).toContain('<link rel="canonical" href="https://example.com/" />');
    expect(head).toContain('property="og:image:type" content="image/png"');
    expect(head).toContain('name="twitter:image:alt"');
    expect(head).not.toContain('https://example.com//');
    expect(head).not.toContain('SearchAction');

    const jsonLdSource = head.match(
      /<script type="application\/ld\+json">(.+)<\/script>/,
    )?.[1];
    expect(jsonLdSource).toBeDefined();

    const jsonLd = JSON.parse(jsonLdSource ?? '{}') as {
      '@graph': Array<Record<string, unknown>>;
    };
    expect(jsonLd['@graph']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ '@type': 'Organization', name: 'Fixture Site' }),
        expect.objectContaining({ '@type': 'WebSite', url: 'https://example.com/' }),
      ]),
    );
  });

  it('generates robots, sitemap and manifest from the same site config', () => {
    const artifacts = buildSeoArtifacts(fixtureSiteConfig);

    expect(artifacts.robots).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://example.com/sitemap.xml\n',
    );
    expect(artifacts.sitemap).toContain('<loc>https://example.com/</loc>');
    expect(artifacts.sitemap).not.toContain('<changefreq>');

    const manifest = JSON.parse(artifacts.manifest) as {
      id: string;
      name: string;
      icons: Array<{ sizes: string; type: string; purpose: string }>;
    };
    expect(manifest).toMatchObject({ id: '/', name: 'Fixture SiteFixture' });
    expect(manifest.icons).toEqual([
      expect.objectContaining({ sizes: '192x192', type: 'image/png', purpose: 'any' }),
      expect.objectContaining({ sizes: '512x512', type: 'image/png', purpose: 'any' }),
    ]);
  });
});
