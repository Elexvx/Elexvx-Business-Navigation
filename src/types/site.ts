export type LinkStatus =
  | 'available'
  | 'maintenance'
  | 'unavailable'
  | 'beta'
  | 'deprecated';

export interface NavigationLink {
  id: string;
  name: string;
  url: string;
  description: string;
  icon?: string;
  tags: string[];
  status: LinkStatus;
}

export interface NavigationSubcategory {
  id: string;
  name: string;
  links: NavigationLink[];
}

export interface NavigationCategory {
  id: string;
  category: string;
  links: NavigationLink[];
  subcategories: NavigationSubcategory[];
}

export interface SearchEngine {
  id: string;
  name: string;
  displayName: string;
  baseUrl: string;
  queryParam: string;
  icon?: string;
  placeholder?: string;
  enabled: boolean;
}

export interface SiteMetadata {
  name: string;
  shortName: string;
  logo: string;
  url: string;
  description: string;
  language: string;
  locale: string;
  author: string;
  copyright: string;
  icp: string;
}

export interface SeoConfig {
  defaultTitle: string;
  titleTemplate: string;
  defaultImage: string;
  twitterHandle?: string;
  keywords: string[];
}

export interface SearchConfig {
  defaultEngine: string;
  enabledEngines: string[];
  showEngineSelector: boolean;
  maxSuggestions: number;
  engines: SearchEngine[];
}

export interface StatusGroupConfig {
  id: string;
  name: string;
  prefixes: string[];
}

export interface StatusConfig {
  url: string;
  title: string;
  description: string;
  historyDays: number;
  refreshIntervalSeconds: number;
  groups: StatusGroupConfig[];
}

export interface SiteConfig {
  site: SiteMetadata;
  seo: SeoConfig;
  search: SearchConfig;
  status: StatusConfig;
  navigation: NavigationCategory[];
}

export type SearchScope = 'internal' | 'web';
