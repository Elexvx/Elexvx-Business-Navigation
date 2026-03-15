import { getCollection } from 'astro:content';

const fallbackSeoConfig = {
  siteName: '',
  siteDescription: '',
  siteUrl: '',
  defaultTitle: '',
  titleTemplate: '%s',
  defaultImage: '',
  twitterHandle: '',
  author: '',
  keywords: [],
  language: 'zh-CN',
  locale: 'zh_CN'
};

export async function getNavigation() {
  const [entry] = await getCollection('links');
  return Array.isArray(entry?.data?.navigation) ? entry.data.navigation : [];
}

export async function getSearchData() {
  const [entry] = await getCollection('search');
  const data = entry?.data ?? {};

  const searchEngines = Array.isArray(data.searchEngines) ? data.searchEngines : [];
  const defaultSearchEngine = data.defaultSearchEngine || searchEngines[0]?.name || 'bing';
  const searchConfig = {
    defaultEngine: data.searchConfig?.defaultEngine || defaultSearchEngine,
    enabledEngines: Array.isArray(data.searchConfig?.enabledEngines)
      ? data.searchConfig.enabledEngines
      : searchEngines.map((engine) => engine.name),
    showEngineSelector: Boolean(data.searchConfig?.showEngineSelector ?? true),
    maxSuggestions: Number(data.searchConfig?.maxSuggestions ?? 5)
  };

  return { searchEngines, defaultSearchEngine, searchConfig };
}

export function getSearchEngine(searchEngines, name) {
  return searchEngines.find((engine) => engine.name === name);
}

export async function getSeoConfig() {
  const [entry] = await getCollection('seo');
  return { ...fallbackSeoConfig, ...(entry?.data?.seoConfig ?? {}) };
}

export function generatePageTitle(seoConfig, pageTitle) {
  if (!pageTitle) return seoConfig.defaultTitle;
  return (seoConfig.titleTemplate || '%s').replace('%s', pageTitle);
}

export function generatePageDescription(seoConfig, pageDescription) {
  return pageDescription || seoConfig.siteDescription;
}

export function generateKeywords(seoConfig, pageKeywords) {
  const allKeywords = [...(seoConfig.keywords || []), ...(pageKeywords || [])];
  return [...new Set(allKeywords)].join(', ');
}

export function generateCanonicalUrl(seoConfig, pathname) {
  return `${seoConfig.siteUrl}${pathname}`;
}

