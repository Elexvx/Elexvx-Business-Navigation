import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { IndexHtmlTransformContext, Plugin, ResolvedConfig } from 'vite';

import { parseSiteConfig } from './siteSchema.ts';
import type { SiteConfig } from '../types/site.ts';

export const siteConfigFile = 'src/config/site.yaml';
export const virtualSiteConfigId = 'virtual:site-config';
const resolvedVirtualSiteConfigId = `\0${virtualSiteConfigId}`;
const siteHeadMarker = '<!-- site-head: injected from src/config/site.yaml during Vite transform -->';

interface SiteConfigCache {
  mtimeMs: number;
  config: SiteConfig;
}

let resolvedConfig: ResolvedConfig | undefined;
let cache: SiteConfigCache | undefined;

function getConfigPath(root: string): string {
  return resolve(root, siteConfigFile);
}

export function loadSiteConfig(root: string): SiteConfig {
  const filePath = getConfigPath(root);
  const stats = statSync(filePath);
  const cached = cache;
  if (cached && cached.mtimeMs === stats.mtimeMs) return cached.config;

  const source = readFileSync(filePath, 'utf8');
  const config = parseSiteConfig(parseYaml(source), { root });
  cache = { mtimeMs: stats.mtimeMs, config };
  return config;
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeJson(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function getCanonicalUrl(config: SiteConfig): string {
  return new URL('/', `${config.site.url}/`).href;
}

function getAbsoluteUrl(config: SiteConfig, value: string): string {
  return new URL(value, getCanonicalUrl(config)).href;
}

export function buildSeoHead(config: SiteConfig): string {
  const canonicalUrl = getCanonicalUrl(config);
  const imageUrl = getAbsoluteUrl(config, config.seo.defaultImage);
  const logoUrl = getAbsoluteUrl(config, config.site.logo);
  const keywords = config.seo.keywords.join(', ');
  const organizationId = `${canonicalUrl}#organization`;
  const websiteId = `${canonicalUrl}#website`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: config.site.name,
        alternateName: config.site.shortName,
        url: canonicalUrl,
        description: config.site.description,
        logo: {
          '@type': 'ImageObject',
          '@id': `${canonicalUrl}#logo`,
          url: logoUrl,
          contentUrl: logoUrl,
          caption: `${config.site.name} Logo`,
        },
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        name: config.site.name,
        alternateName: config.site.shortName,
        url: canonicalUrl,
        description: config.site.description,
        inLanguage: config.site.language,
        keywords,
        publisher: { '@id': organizationId },
      },
    ],
  };

  const twitterTags = config.seo.twitterHandle
    ? `\n    <meta name="twitter:site" content="${escapeAttribute(config.seo.twitterHandle)}" />\n    <meta name="twitter:creator" content="${escapeAttribute(config.seo.twitterHandle)}" />`
    : '';

  return `
    <title>${escapeAttribute(config.seo.defaultTitle)}</title>
    <meta name="description" content="${escapeAttribute(config.site.description)}" />
    <meta name="keywords" content="${escapeAttribute(keywords)}" />
    <meta name="author" content="${escapeAttribute(config.site.author)}" />
    <meta name="application-name" content="${escapeAttribute(config.site.name)}" />
    <meta name="apple-mobile-web-app-title" content="${escapeAttribute(config.site.shortName)}" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
    <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#182235" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeAttribute(config.seo.defaultTitle)}" />
    <meta property="og:description" content="${escapeAttribute(config.site.description)}" />
    <meta property="og:url" content="${escapeAttribute(canonicalUrl)}" />
    <meta property="og:site_name" content="${escapeAttribute(config.site.name)}" />
    <meta property="og:locale" content="${escapeAttribute(config.site.locale)}" />
    <meta property="og:image" content="${escapeAttribute(imageUrl)}" />
    <meta property="og:image:secure_url" content="${escapeAttribute(imageUrl)}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeAttribute(`${config.site.name}企业服务导航分享图`)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttribute(config.seo.defaultTitle)}" />
    <meta name="twitter:description" content="${escapeAttribute(config.site.description)}" />
    <meta name="twitter:image" content="${escapeAttribute(imageUrl)}" />
    <meta name="twitter:image:alt" content="${escapeAttribute(`${config.site.name}企业服务导航分享图`)}" />${twitterTags}
    <script type="application/ld+json">${escapeJson(structuredData)}</script>
  `.trim();
}

export function buildStatusSeoHead(config: SiteConfig): string {
  const canonicalUrl = new URL('/', `${config.status.url}/`).href;
  const imageUrl = new URL(config.seo.defaultImage, canonicalUrl).href;
  const title = config.status.title;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    url: canonicalUrl,
    description: config.status.description,
    inLanguage: config.site.language,
    isPartOf: {
      '@type': 'WebSite',
      name: config.site.name,
      url: getCanonicalUrl(config),
    },
  };

  return `
    <title>${escapeAttribute(title)}</title>
    <meta name="description" content="${escapeAttribute(config.status.description)}" />
    <meta name="author" content="${escapeAttribute(config.site.author)}" />
    <meta name="application-name" content="${escapeAttribute(title)}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/status.webmanifest" />
    <link rel="sitemap" type="application/xml" href="/status-sitemap.xml" />
    <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#182235" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeAttribute(title)}" />
    <meta property="og:description" content="${escapeAttribute(config.status.description)}" />
    <meta property="og:url" content="${escapeAttribute(canonicalUrl)}" />
    <meta property="og:site_name" content="${escapeAttribute(config.site.name)}" />
    <meta property="og:locale" content="${escapeAttribute(config.site.locale)}" />
    <meta property="og:image" content="${escapeAttribute(imageUrl)}" />
    <meta property="og:image:secure_url" content="${escapeAttribute(imageUrl)}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeAttribute(`${config.site.name}服务状态分享图`)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttribute(title)}" />
    <meta name="twitter:description" content="${escapeAttribute(config.status.description)}" />
    <meta name="twitter:image" content="${escapeAttribute(imageUrl)}" />
    <meta name="twitter:image:alt" content="${escapeAttribute(`${config.site.name}服务状态分享图`)}" />
    <script type="application/ld+json">${escapeJson(structuredData)}</script>
  `.trim();
}

export interface SeoArtifacts {
  robots: string;
  sitemap: string;
  manifest: string;
  statusSitemap: string;
  statusManifest: string;
}

export function buildSeoArtifacts(config: SiteConfig): SeoArtifacts {
  const canonicalUrl = getCanonicalUrl(config);
  const statusUrl = new URL('/', `${config.status.url}/`).href;
  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${canonicalUrl}sitemap.xml\nSitemap: ${statusUrl}status-sitemap.xml\n`;
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${escapeXml(canonicalUrl)}</loc>\n  </url>\n</urlset>\n`;
  const statusSitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${escapeXml(statusUrl)}</loc>\n  </url>\n  <url>\n    <loc>${escapeXml(`${statusUrl}history`)}</loc>\n  </url>\n</urlset>\n`;
  const manifest = `${JSON.stringify(
    {
      id: '/',
      name: `${config.site.name}${config.site.shortName}`,
      short_name: config.site.shortName,
      description: config.site.description,
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#f7f9fc',
      theme_color: '#1677ff',
      lang: config.site.language,
      categories: ['business', 'productivity', 'utilities'],
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
      ],
    },
    null,
    2,
  )}\n`;

  const statusManifest = `${JSON.stringify(
    {
      id: '/',
      name: config.status.title,
      short_name: '服务状态',
      description: config.status.description,
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#1557d6',
      lang: config.site.language,
      categories: ['business', 'productivity', 'utilities'],
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      ],
    },
    null,
    2,
  )}\n`;

  return { robots, sitemap, manifest, statusSitemap, statusManifest };
}

export function siteConfigPlugin(): Plugin {
  return {
    name: 'elexvx-site-config',
    enforce: 'pre',
    configResolved(config) {
      resolvedConfig = config;
      loadSiteConfig(config.root);
    },
    resolveId(id) {
      return id === virtualSiteConfigId ? resolvedVirtualSiteConfigId : undefined;
    },
    load(id) {
      if (id !== resolvedVirtualSiteConfigId) return undefined;
      const root = resolvedConfig?.root ?? process.cwd();
      return `const siteConfig = ${JSON.stringify(loadSiteConfig(root))};\nexport { siteConfig };\nexport default siteConfig;`;
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
        const config = loadSiteConfig(server.config.root);
        const artifacts = buildSeoArtifacts(config);
        const asset =
          pathname === '/robots.txt'
            ? { content: artifacts.robots, contentType: 'text/plain; charset=utf-8' }
            : pathname === '/sitemap.xml'
              ? { content: artifacts.sitemap, contentType: 'application/xml; charset=utf-8' }
              : pathname === '/site.webmanifest'
                ? { content: artifacts.manifest, contentType: 'application/manifest+json; charset=utf-8' }
                : pathname === '/status-sitemap.xml'
                  ? { content: artifacts.statusSitemap, contentType: 'application/xml; charset=utf-8' }
                  : pathname === '/status.webmanifest'
                    ? { content: artifacts.statusManifest, contentType: 'application/manifest+json; charset=utf-8' }
                : undefined;

        if (!asset) {
          next();
          return;
        }

        response.statusCode = 200;
        response.setHeader('Content-Type', asset.contentType);
        response.setHeader('Cache-Control', 'no-cache');
        response.end(asset.content);
      });
    },
    transformIndexHtml(html: string, _ctx: IndexHtmlTransformContext) {
      const root = resolvedConfig?.root ?? process.cwd();
      const config = loadSiteConfig(root);
      const head = _ctx.filename.endsWith('status.html')
        ? buildStatusSeoHead(config)
        : buildSeoHead(config);
      const withLanguage = html.replace(
        /(<html\b[^>]*\blang=)(["'])[^"']*\2/i,
        (_match, prefix: string) => `${prefix}"${escapeAttribute(config.site.language)}"`,
      );
      if (withLanguage.includes(siteHeadMarker)) {
        return withLanguage.replace(siteHeadMarker, head);
      }
      return withLanguage.replace('</head>', `${head}\n  </head>`);
    },
    generateBundle() {
      const root = resolvedConfig?.root ?? process.cwd();
      const artifacts = buildSeoArtifacts(loadSiteConfig(root));
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: artifacts.robots });
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: artifacts.sitemap });
      this.emitFile({ type: 'asset', fileName: 'site.webmanifest', source: artifacts.manifest });
      this.emitFile({ type: 'asset', fileName: 'status-sitemap.xml', source: artifacts.statusSitemap });
      this.emitFile({ type: 'asset', fileName: 'status.webmanifest', source: artifacts.statusManifest });
    },
    handleHotUpdate(context) {
      const root = resolvedConfig?.root ?? process.cwd();
      if (context.file !== getConfigPath(root)) return undefined;
      cache = undefined;
      loadSiteConfig(root);
      context.server.ws.send({ type: 'full-reload' });
      return undefined;
    },
  };
}
