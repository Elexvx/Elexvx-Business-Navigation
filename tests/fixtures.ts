import type { NavigationCategory, NavigationLink, SearchEngine, SiteConfig } from '../src/types/site';

export const fixtureLink = (overrides: Partial<NavigationLink> = {}): NavigationLink => ({
  id: 'fixture-link',
  name: 'Fixture Link',
  url: 'https://example.com/fixture',
  description: 'Fixture description',
  tags: ['fixture'],
  status: 'available',
  ...overrides,
});

export const fixtureNavigation: NavigationCategory[] = [
  {
    id: 'category-one',
    category: 'Category One',
    links: [fixtureLink()],
    subcategories: [
      {
        id: 'subcategory-one',
        name: 'Subcategory One',
        links: [fixtureLink({ id: 'fixture-sub-link', name: 'Sub Link' })],
      },
    ],
  },
  {
    id: 'category-two',
    category: 'Category Two',
    links: [fixtureLink({ id: 'fixture-two', name: 'Second Link' })],
    subcategories: [],
  },
];

export const fixtureEngine = (overrides: Partial<SearchEngine> = {}): SearchEngine => ({
  id: 'fixture-engine',
  name: 'fixture-engine',
  displayName: 'Fixture Search',
  baseUrl: 'https://example.com/search',
  queryParam: 'q',
  enabled: true,
  ...overrides,
});

export const fixtureSiteConfig: SiteConfig = {
  site: {
    name: 'Fixture Site',
    shortName: 'Fixture',
    logo: '/favicon-32x32.png',
    url: 'https://example.com',
    description: 'Fixture site description',
    language: 'zh-CN',
    locale: 'zh_CN',
    author: 'Fixture',
    copyright: 'Fixture',
    icp: '',
  },
  seo: {
    defaultTitle: 'Fixture Site',
    titleTemplate: '%s',
    defaultImage: '/og-image.png',
    keywords: ['fixture'],
  },
  search: {
    defaultEngine: 'fixture-engine',
    enabledEngines: ['fixture-engine'],
    showEngineSelector: true,
    maxSuggestions: 5,
    engines: [fixtureEngine()],
  },
  status: {
    url: 'https://status.example.com',
    title: 'Fixture Status',
    description: 'Fixture status description',
    historyDays: 60,
    refreshIntervalSeconds: 300,
    groups: [{ id: 'services', name: 'Services', prefixes: ['A'] }],
  },
  navigation: fixtureNavigation,
};
