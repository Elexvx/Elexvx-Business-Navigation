const STATUS_DOMAIN = 'status.elexvx.com';
const STATUS_ENTRY_PATHS = new Set(['/', '/history']);

export function resolveStatusDomainEntry(url: URL): string | undefined {
  if (url.hostname.toLocaleLowerCase() !== STATUS_DOMAIN) return undefined;

  const pathname = url.pathname.replace(/\/+$/, '') || '/';
  return STATUS_ENTRY_PATHS.has(pathname) ? '/status' : undefined;
}
