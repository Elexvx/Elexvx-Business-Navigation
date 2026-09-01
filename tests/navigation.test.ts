import { describe, expect, it } from 'vitest';

import {
  countNavigationCategories,
  countNavigationLinks,
  flattenNavigationLinks,
} from '../src/lib/navigation';
import { fixtureNavigation } from './fixtures';

describe('navigation helpers', () => {
  it('flattens links in category and subcategory display order', () => {
    expect(flattenNavigationLinks(fixtureNavigation).map((link) => link.name)).toEqual([
      'Fixture Link',
      'Sub Link',
      'Second Link',
    ]);
  });

  it('counts categories and all nested links', () => {
    expect(countNavigationCategories(fixtureNavigation)).toBe(2);
    expect(countNavigationLinks(fixtureNavigation)).toBe(3);
  });
});
