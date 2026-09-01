import siteConfigValue from 'virtual:site-config';

import type { SiteConfig } from '../types/site';

export const siteConfig: SiteConfig = siteConfigValue;
export default siteConfig;

export type {
  LinkStatus,
  NavigationCategory,
  NavigationLink,
  NavigationSubcategory,
  SearchEngine,
  SearchScope,
  SearchConfig,
  SeoConfig,
  SiteConfig,
  SiteMetadata,
  StatusConfig,
  StatusGroupConfig,
} from '../types/site';
