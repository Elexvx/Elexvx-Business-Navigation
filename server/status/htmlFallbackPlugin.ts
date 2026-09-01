import type { Plugin } from 'vite';

const STATUS_PATHS = new Set(['/status', '/status/', '/status/history', '/status/history/', '/history', '/history/']);

function rewriteStatusHtml(url: string | undefined): string | undefined {
  if (!url) return url;
  const parsed = new URL(url, 'http://localhost');
  if (!STATUS_PATHS.has(parsed.pathname)) return url;
  return `/status.html${parsed.search}`;
}

export function statusHtmlFallbackPlugin(): Plugin {
  return {
    name: 'status-html-fallback',
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        request.url = rewriteStatusHtml(request.url);
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((request, _response, next) => {
        request.url = rewriteStatusHtml(request.url);
        next();
      });
    },
  };
}
