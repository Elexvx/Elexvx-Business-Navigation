import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';

import type {
  LinkStatus,
  NavigationCategory,
  NavigationLink,
  NavigationSubcategory,
  SearchEngine,
  SiteConfig,
} from '../types/site.ts';

export const linkStatuses = [
  'available',
  'maintenance',
  'unavailable',
  'beta',
  'deprecated',
] as const satisfies readonly LinkStatus[];

const nonEmptyString = z.string().trim().min(1);
const idSchema = nonEmptyString.regex(/^[\p{L}\p{N}_-]+$/u, '只能包含字母、数字、下划线或连字符');
const urlSchema = nonEmptyString.refine((value) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}, '必须是 http 或 https URL');
const assetSchema = nonEmptyString.refine((value) => {
  if (value.startsWith('/')) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}, '必须是以 / 开头的本地资源路径或 http(s) URL');

const rawLinkSchema = z.object({
  id: idSchema.optional(),
  name: nonEmptyString,
  url: urlSchema,
  description: z.string().trim().default(''),
  icon: assetSchema.optional(),
  tags: z.array(nonEmptyString).default([]),
  status: z.enum(linkStatuses).default('available'),
});

const rawSubcategorySchema = z.object({
  id: idSchema.optional(),
  name: nonEmptyString,
  links: z.array(rawLinkSchema).min(1),
});

const rawCategorySchema = z
  .object({
    id: idSchema.optional(),
    category: nonEmptyString,
    links: z.array(rawLinkSchema).default([]),
    subcategories: z.array(rawSubcategorySchema).default([]),
  })
  .refine((value) => value.links.length > 0 || value.subcategories.length > 0, {
    message: '分类至少需要一个链接或二级分类',
    path: ['links'],
  });

const rawSiteSchema = z.object({
  name: nonEmptyString,
  shortName: nonEmptyString.optional(),
  logo: assetSchema,
  url: urlSchema,
  description: nonEmptyString,
  language: nonEmptyString.default('zh-CN'),
  locale: nonEmptyString.default('zh_CN'),
  author: z.string().trim().default(''),
  copyright: z.string().trim().default(''),
  icp: z.string().trim().default(''),
});

const rawSeoSchema = z.object({
  defaultTitle: nonEmptyString,
  titleTemplate: nonEmptyString.default('%s'),
  defaultImage: assetSchema,
  twitterHandle: z
    .string()
    .trim()
    .min(1)
    .refine((value) => !value.includes('yourhandle'), '不能使用占位 Twitter handle')
    .optional(),
  keywords: z.array(nonEmptyString).default([]),
});

const rawSearchEngineSchema = z.object({
  id: idSchema.optional(),
  name: idSchema,
  displayName: nonEmptyString,
  baseUrl: urlSchema,
  queryParam: nonEmptyString,
  icon: z.string().trim().optional(),
  placeholder: z.string().trim().optional(),
});

const rawSearchSchema = z.object({
  defaultEngine: idSchema,
  enabledEngines: z.array(idSchema).min(1),
  showEngineSelector: z.boolean().default(true),
  maxSuggestions: z.number().int().min(1).max(20).default(5),
  engines: z.array(rawSearchEngineSchema).min(1),
});

export const siteConfigSchema = z.object({
  site: rawSiteSchema,
  seo: rawSeoSchema,
  search: rawSearchSchema,
  navigation: z.array(rawCategorySchema).min(1),
});

type RawSiteConfig = z.infer<typeof siteConfigSchema>;

export interface NormalizeOptions {
  /** Project root used for checking local assets during a Vite build. */
  root?: string;
  /** Set false for callers that only want schema normalization. */
  validateAssets?: boolean;
}

export function toStableId(value: string, fallback = 'item'): string {
  const normalized = value
    .trim()
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || fallback;
}

function formatPath(path: PropertyKey[]): string {
  return path.length > 0 ? path.map(String).join('.') : 'site';
}

function normalizeLink(link: z.infer<typeof rawLinkSchema>, index: number): NavigationLink {
  return {
    id: link.id ?? toStableId(link.name, `link-${index + 1}`),
    name: link.name,
    url: link.url,
    description: link.description,
    ...(link.icon ? { icon: link.icon } : {}),
    tags: [...link.tags],
    status: link.status,
  };
}

function normalizeSubcategory(
  subcategory: z.infer<typeof rawSubcategorySchema>,
  index: number,
): NavigationSubcategory {
  return {
    id: subcategory.id ?? toStableId(subcategory.name, `subcategory-${index + 1}`),
    name: subcategory.name,
    links: subcategory.links.map(normalizeLink),
  };
}

function normalizeCategory(category: z.infer<typeof rawCategorySchema>, index: number): NavigationCategory {
  return {
    id: category.id ?? toStableId(category.category, `category-${index + 1}`),
    category: category.category,
    links: category.links.map(normalizeLink),
    subcategories: category.subcategories.map(normalizeSubcategory),
  };
}

function assertUnique(values: Array<{ value: string; path: PropertyKey[] }>, label: string): void {
  const seen = new Map<string, PropertyKey[]>();
  for (const entry of values) {
    const key = entry.value.trim().toLocaleLowerCase();
    const previousPath = seen.get(key);
    if (previousPath) {
      throw new Error(
        `配置校验失败：${label}重复（${formatPath(previousPath)} 与 ${formatPath(entry.path)}）: ${entry.value}`,
      );
    }
    seen.set(key, entry.path);
  }
}

function validateNormalizedConfig(config: SiteConfig, options: NormalizeOptions): void {
  const categoryEntries: Array<{ value: string; path: PropertyKey[] }> = [];
  const categoryIdEntries: Array<{ value: string; path: PropertyKey[] }> = [];
  const subcategoryIdEntries: Array<{ value: string; path: PropertyKey[] }> = [];
  const linkEntries: Array<{ value: string; path: PropertyKey[] }> = [];
  const linkIdEntries: Array<{ value: string; path: PropertyKey[] }> = [];
  const urlEntries: Array<{ value: string; path: PropertyKey[] }> = [];

  config.navigation.forEach((category, categoryIndex) => {
    const categoryPath = ['navigation', categoryIndex, 'category'];
    categoryEntries.push({ value: category.category, path: categoryPath });
    categoryIdEntries.push({ value: category.id, path: ['navigation', categoryIndex, 'id'] });

    const collectLink = (link: NavigationLink, path: PropertyKey[]) => {
      linkEntries.push({ value: link.name, path: [...path, 'name'] });
      linkIdEntries.push({ value: link.id, path: [...path, 'id'] });
      urlEntries.push({ value: link.url, path: [...path, 'url'] });
    };

    category.links.forEach((link, linkIndex) =>
      collectLink(link, ['navigation', categoryIndex, 'links', linkIndex]),
    );
    category.subcategories.forEach((subcategory, subcategoryIndex) => {
      subcategoryIdEntries.push({
        value: subcategory.id,
        path: ['navigation', categoryIndex, 'subcategories', subcategoryIndex, 'id'],
      });
      subcategory.links.forEach((link, linkIndex) =>
        collectLink(link, [
          'navigation',
          categoryIndex,
          'subcategories',
          subcategoryIndex,
          'links',
          linkIndex,
        ]),
      );
    });
  });

  assertUnique(categoryEntries, '分类名称');
  assertUnique(categoryIdEntries, '分类 ID');
  assertUnique(subcategoryIdEntries, '二级分类 ID');
  assertUnique(linkEntries, '链接名称');
  assertUnique(linkIdEntries, '链接 ID');
  assertUnique(urlEntries, '链接 URL');

  const engineEntries = config.search.engines.map((engine, index) => ({
    value: engine.id,
    path: ['search', 'engines', index, 'id'],
  }));
  assertUnique(engineEntries, '搜索引擎');

  const engineIds = new Set(config.search.engines.map((engine) => engine.id));
  for (const [index, enabledEngine] of config.search.enabledEngines.entries()) {
    if (!engineIds.has(enabledEngine)) {
      throw new Error(
        `配置校验失败：search.enabledEngines.${index} 引用了不存在的搜索引擎: ${enabledEngine}`,
      );
    }
  }
  if (!engineIds.has(config.search.defaultEngine)) {
    throw new Error(
      `配置校验失败：search.defaultEngine 引用了不存在的搜索引擎: ${config.search.defaultEngine}`,
    );
  }

  if (options.validateAssets !== false && options.root) {
    const localAssets: Array<{ value: string; path: PropertyKey[] }> = [];
    if (config.site.logo.startsWith('/')) {
      localAssets.push({ value: config.site.logo, path: ['site', 'logo'] });
    }
    if (config.seo.defaultImage.startsWith('/')) {
      localAssets.push({ value: config.seo.defaultImage, path: ['seo', 'defaultImage'] });
    }

    config.navigation.forEach((category, categoryIndex) => {
      const visitLink = (link: NavigationLink, path: PropertyKey[]) => {
        if (link.icon?.startsWith('/')) localAssets.push({ value: link.icon, path: [...path, 'icon'] });
      };
      category.links.forEach((link, linkIndex) =>
        visitLink(link, ['navigation', categoryIndex, 'links', linkIndex]),
      );
      category.subcategories.forEach((subcategory, subcategoryIndex) =>
        subcategory.links.forEach((link, linkIndex) =>
          visitLink(link, [
            'navigation',
            categoryIndex,
            'subcategories',
            subcategoryIndex,
            'links',
            linkIndex,
          ]),
        ),
      );
    });

    for (const asset of localAssets) {
      const assetPath = join(options.root, 'public', asset.value.slice(1));
      if (!existsSync(assetPath)) {
        throw new Error(
          `配置校验失败：${formatPath(asset.path)} 引用了不存在的本地资源: ${asset.value}`,
        );
      }
    }
  }
}

export function parseSiteConfig(raw: unknown, options: NormalizeOptions = {}): SiteConfig {
  const parsed = siteConfigSchema.safeParse(raw);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${formatPath(issue.path)}: ${issue.message}`)
      .join('; ');
    throw new Error(`配置校验失败：${details}`);
  }

  const source: RawSiteConfig = parsed.data;
  const navigation = source.navigation.map(normalizeCategory);
  const engines: SearchEngine[] = source.search.engines.map((engine) => {
    const id = engine.id ?? engine.name;
    return {
      id,
      name: engine.name,
      displayName: engine.displayName,
      baseUrl: engine.baseUrl,
      queryParam: engine.queryParam,
      ...(engine.icon ? { icon: engine.icon } : {}),
      ...(engine.placeholder ? { placeholder: engine.placeholder } : {}),
      enabled: source.search.enabledEngines.includes(id),
    };
  });

  const config: SiteConfig = {
    site: {
      name: source.site.name,
      shortName: source.site.shortName ?? source.site.name,
      logo: source.site.logo,
      url: source.site.url.replace(/\/+$/, ''),
      description: source.site.description,
      language: source.site.language,
      locale: source.site.locale,
      author: source.site.author,
      copyright: source.site.copyright,
      icp: source.site.icp,
    },
    seo: {
      defaultTitle: source.seo.defaultTitle,
      titleTemplate: source.seo.titleTemplate,
      defaultImage: source.seo.defaultImage,
      ...(source.seo.twitterHandle ? { twitterHandle: source.seo.twitterHandle } : {}),
      keywords: [...source.seo.keywords],
    },
    search: {
      defaultEngine: source.search.defaultEngine,
      enabledEngines: [...source.search.enabledEngines],
      showEngineSelector: source.search.showEngineSelector,
      maxSuggestions: source.search.maxSuggestions,
      engines,
    },
    navigation,
  };

  validateNormalizedConfig(config, options);
  return config;
}

export function flattenNavigationLinks(navigation: NavigationCategory[]): NavigationLink[] {
  return navigation.flatMap((category) => [
    ...category.links,
    ...category.subcategories.flatMap((subcategory) => subcategory.links),
  ]);
}
