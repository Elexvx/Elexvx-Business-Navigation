import type { NavigationCategory, NavigationLink } from '../types/site';

/** Returns links in display order, including links nested below subcategories. */
export function flattenNavigationLinks(navigation: NavigationCategory[]): NavigationLink[] {
  return navigation.flatMap((category) => [
    ...category.links,
    ...category.subcategories.flatMap((subcategory) => subcategory.links),
  ]);
}
