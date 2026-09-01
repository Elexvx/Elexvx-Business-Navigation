import type {
  NavigationLink,
  SearchConfig,
  SearchEngine,
  SearchScope,
} from '../types/site';

export const SEARCH_SCOPE_STORAGE_KEY = 'preferred-search-scope';
export const SEARCH_ENGINE_STORAGE_KEY = 'preferred-search-engine';

/** Read localStorage defensively so the SPA remains usable in privacy modes. */
export function readStoredValue(key: string): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStoredValue(key: string, value: string): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // A blocked or full storage should not prevent searching or navigation.
  }
}

export function isSearchScope(value: string | null): value is SearchScope {
  return value === 'internal' || value === 'web';
}

/**
 * Return only engines that are both declared and enabled in the site config.
 * The enabled flag is derived by the config normalizer, while the explicit
 * list keeps this helper compatible with hand-authored test fixtures.
 */
export function getEnabledSearchEngines(search: SearchConfig): SearchEngine[] {
  const enabledIds = new Set(search.enabledEngines);
  return search.engines.filter((engine) => engine.enabled && enabledIds.has(engine.id));
}

export function getPreferredSearchEngine(
  search: SearchConfig,
  storedEngineId = readStoredValue(SEARCH_ENGINE_STORAGE_KEY),
): SearchEngine | undefined {
  const enabledEngines = getEnabledSearchEngines(search);
  return (
    enabledEngines.find((engine) => engine.id === storedEngineId) ??
    enabledEngines.find((engine) => engine.id === search.defaultEngine) ??
    enabledEngines[0]
  );
}

/**
 * Search names, descriptions and tags case-insensitively. Keeping this in a
 * pure helper makes the matching contract easy to test without rendering.
 */
export function searchNavigationLinks(
  links: NavigationLink[],
  query: string,
  maxResults = 5,
): NavigationLink[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery || maxResults <= 0) return [];

  return links
    .filter((link) => {
      const searchableText = [link.name, link.description, ...link.tags]
        .join(' ')
        .toLocaleLowerCase();
      return searchableText.includes(normalizedQuery);
    })
    .slice(0, maxResults);
}

/** Build an external query URL using URLSearchParams-compatible encoding. */
export function buildSearchUrl(engine: SearchEngine, query: string): string | null {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return null;

  try {
    const url = new URL(engine.baseUrl);
    url.searchParams.set(engine.queryParam, normalizedQuery);
    return url.toString();
  } catch {
    return null;
  }
}

/** Open a user-selected destination in a new tab with opener isolation. */
export function openExternalUrl(url: string): boolean {
  if (typeof window === 'undefined') return false;

  const openedWindow = window.open(url, '_blank', 'noopener,noreferrer');
  if (openedWindow) {
    try {
      openedWindow.opener = null;
    } catch {
      // Cross-origin WindowProxy implementations can reject this assignment.
    }
  }
  return openedWindow !== null;
}
