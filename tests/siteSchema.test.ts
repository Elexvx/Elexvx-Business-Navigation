import { describe, expect, it } from 'vitest';

import { flattenNavigationLinks, parseSiteConfig, toStableId } from '../src/config/siteSchema';

const minimalConfig = {
  site: {
    name: '配置测试站',
    logo: '/favicon-32x32.png',
    url: 'https://example.com',
    description: '测试站点',
  },
  seo: {
    defaultTitle: '配置测试站',
    defaultImage: '/og-image.png',
  },
  search: {
    defaultEngine: 'bing',
    enabledEngines: ['bing'],
    engines: [
      {
        name: 'bing',
        displayName: 'Bing',
        baseUrl: 'https://www.bing.com/search',
        queryParam: 'q',
      },
    ],
  },
  navigation: [
    {
      category: '分类',
      links: [
        {
          name: '链接',
          url: 'https://example.com/link#section',
        },
      ],
    },
  ],
};

describe('site configuration schema', () => {
  it('normalizes ids, default status, tags and trailing site slashes', () => {
    const config = parseSiteConfig(minimalConfig, { validateAssets: false });

    expect(config.site.url).toBe('https://example.com');
    expect(config.navigation[0]?.id).toBe('分类');
    expect(config.navigation[0]?.links[0]).toMatchObject({
      id: '链接',
      status: 'available',
      tags: [],
    });
    expect(flattenNavigationLinks(config.navigation)).toHaveLength(1);
  });

  it('creates readable stable ids and rejects duplicate links or URLs', () => {
    expect(toStableId('  Hello, World! ')).toBe('hello-world');
    expect(toStableId('---')).toBe('item');

    const duplicate = structuredClone(minimalConfig);
    duplicate.navigation[0].links.push({
      name: '链接二',
      url: 'https://example.com/link#section',
    });

    expect(() => parseSiteConfig(duplicate, { validateAssets: false })).toThrow(/链接 URL重复/);
  });

  it('rejects invalid external URLs and unknown enabled engines', () => {
    const invalidUrl = structuredClone(minimalConfig);
    invalidUrl.navigation[0].links[0].url = 'javascript:alert(1)';
    expect(() => parseSiteConfig(invalidUrl, { validateAssets: false })).toThrow(/必须是 http 或 https URL/);

    const unknownEngine = structuredClone(minimalConfig);
    unknownEngine.search.enabledEngines = ['missing'];
    expect(() => parseSiteConfig(unknownEngine, { validateAssets: false })).toThrow(/引用了不存在的搜索引擎/);
  });
});
