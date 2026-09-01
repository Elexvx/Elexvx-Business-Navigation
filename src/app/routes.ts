export type AppRoute = 'navigation' | 'status' | 'status-history';

export function resolveAppRoute(hostname: string, pathname: string): AppRoute {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  const isStatusDomain = hostname.toLocaleLowerCase() === 'status.elexvx.com';

  if (isStatusDomain) {
    return normalizedPath === '/history' || normalizedPath === '/status/history'
      ? 'status-history'
      : 'status';
  }
  if (normalizedPath === '/status/history' || normalizedPath === '/history') return 'status-history';
  if (normalizedPath === '/status') return 'status';
  return 'navigation';
}

export function statusHistoryHref(hostname: string): string {
  return hostname.toLocaleLowerCase() === 'status.elexvx.com' ? '/history' : '/status/history';
}

export function statusHomeHref(hostname: string): string {
  return hostname.toLocaleLowerCase() === 'status.elexvx.com' ? '/' : '/status';
}
