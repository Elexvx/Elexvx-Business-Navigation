import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildSearchUrl,
  getEnabledSearchEngines,
  getPreferredSearchEngine,
  openExternalUrl,
  searchNavigationLinks,
} from '../src/lib/search';
import { fixtureEngine, fixtureLink } from './fixtures';

describe('search helpers', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('matches names, descriptions and tags and respects the result limit', () => {
    const links = [
      fixtureLink({ id: 'one', name: 'Alpha', tags: ['shared'] }),
      fixtureLink({ id: 'two', name: 'Beta', description: 'Shared description' }),
      fixtureLink({ id: 'three', name: 'Gamma', tags: ['shared'] }),
    ];

    expect(searchNavigationLinks(links, ' shared ', 2).map((link) => link.id)).toEqual([
      'one',
      'two',
    ]);
    expect(searchNavigationLinks(links, '   ')).toEqual([]);
  });

  it('builds an encoded query URL and handles an empty query', () => {
    const url = buildSearchUrl(fixtureEngine(), '中文 & a/b');

    expect(url).toBe('https://example.com/search?q=%E4%B8%AD%E6%96%87+%26+a%2Fb');
    expect(buildSearchUrl(fixtureEngine(), '  ')).toBeNull();
  });

  it('keeps only declared enabled engines and honors a stored preference', () => {
    const engines = [fixtureEngine(), fixtureEngine({ id: 'disabled', enabled: false })];
    const search = {
      defaultEngine: 'fixture-engine',
      enabledEngines: ['fixture-engine'],
      showEngineSelector: true,
      maxSuggestions: 5,
      engines,
    };

    expect(getEnabledSearchEngines(search).map((engine) => engine.id)).toEqual(['fixture-engine']);
    window.localStorage.setItem('preferred-search-engine', 'fixture-engine');
    expect(getPreferredSearchEngine(search)?.id).toBe('fixture-engine');
  });

  it('opens URLs in a new isolated tab without contacting a real destination', () => {
    const opened = { opener: {} };
    const open = vi.spyOn(window, 'open').mockReturnValue(opened as Window);

    expect(openExternalUrl('https://example.com/destination')).toBe(true);
    expect(open).toHaveBeenCalledWith(
      'https://example.com/destination',
      '_blank',
      'noopener,noreferrer',
    );
    expect(opened.opener).toBeNull();
  });
});
