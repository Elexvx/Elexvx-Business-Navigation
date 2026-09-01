import type { NavigationCategory, NavigationLink } from '../types/site';

/**
 * Flatten the configured navigation while keeping the visual order used by
 * the dashboard. Links directly under a category come before its
 * subcategories.
 */
export function flattenNavigationLinks(navigation: NavigationCategory[]): NavigationLink[] {
  return navigation.flatMap((category) => [
    ...category.links,
    ...category.subcategories.flatMap((subcategory) => subcategory.links),
  ]);
}

export function countNavigationLinks(navigation: NavigationCategory[]): number {
  return flattenNavigationLinks(navigation).length;
}

export function countNavigationCategories(navigation: NavigationCategory[]): number {
  return navigation.length;
}
