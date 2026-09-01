/// <reference types="vite/client" />

declare module 'virtual:site-config' {
  import type { SiteConfig } from './types/site';

  const siteConfig: SiteConfig;
  export { siteConfig };
  export default siteConfig;
}
