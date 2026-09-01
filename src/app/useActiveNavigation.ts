import { useEffect, useMemo, useState } from 'react';

import type { NavigationCategory } from '../types/site';

export function categoryAnchorId(category: NavigationCategory): string {
  return `category-${category.id}`;
}

export function subcategoryAnchorId(categoryId: string, subcategoryId: string): string {
  // Subcategory sections are keyed by their normalized id. Category ids are
  // intentionally not included so the anchor stays compatible with the
  // dashboard's public section ids and remains stable if a category label is
  // renamed around an existing subcategory.
  void categoryId;
  return `subcategory-${subcategoryId}`;
}

export function navigationKeyForCategory(category: NavigationCategory): string {
  return categoryAnchorId(category);
}

export function navigationKeyForSubcategory(categoryId: string, subcategoryId: string): string {
  return subcategoryAnchorId(categoryId, subcategoryId);
}

interface NavigationAnchor {
  id: string;
  key: string;
}

function getNavigationAnchors(navigation: NavigationCategory[]): NavigationAnchor[] {
  return navigation.flatMap((category) => [
    {
      id: categoryAnchorId(category),
      key: navigationKeyForCategory(category),
    },
    ...category.subcategories.map((subcategory) => ({
      id: subcategoryAnchorId(category.id, subcategory.id),
      key: navigationKeyForSubcategory(category.id, subcategory.id),
    })),
  ]);
}

function getKeyFromHash(hash: string, anchors: NavigationAnchor[]): string | undefined {
  const normalizedHash = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!normalizedHash) return undefined;

  let decodedHash = normalizedHash;
  try {
    decodedHash = decodeURIComponent(normalizedHash);
  } catch {
    // Keep the original hash when it is not valid URI encoding.
  }

  return anchors.find((anchor) => anchor.id === normalizedHash || anchor.id === decodedHash)?.key;
}

function getClosestVisibleAnchor(anchors: NavigationAnchor[]): string | undefined {
  const visibleAnchors = anchors
    .map((anchor) => {
      const element = document.getElementById(anchor.id);
      if (!element) return undefined;

      const top = element.getBoundingClientRect().top;
      return { key: anchor.key, distance: Math.abs(top - 88), top };
    })
    .filter((anchor): anchor is { key: string; distance: number; top: number } => Boolean(anchor))
    .filter((anchor) => anchor.top <= window.innerHeight * 0.72);

  if (visibleAnchors.length === 0) return undefined;

  return visibleAnchors.sort((first, second) => {
    const firstIsBelowViewportTop = first.top >= 0;
    const secondIsBelowViewportTop = second.top >= 0;
    if (firstIsBelowViewportTop !== secondIsBelowViewportTop) {
      return firstIsBelowViewportTop ? -1 : 1;
    }
    return first.distance - second.distance;
  })[0]?.key;
}

export function useActiveNavigation(navigation: NavigationCategory[]): string | undefined {
  const anchors = useMemo(() => getNavigationAnchors(navigation), [navigation]);
  const firstKey = anchors[0]?.key;
  const [selectedKey, setSelectedKey] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return firstKey;
    return getKeyFromHash(window.location.hash, anchors) ?? firstKey;
  });

  useEffect(() => {
    const updateFromHash = () => {
      const nextKey = getKeyFromHash(window.location.hash, anchors);
      if (nextKey) setSelectedKey(nextKey);
    };

    const updateFromScroll = () => {
      const nextKey = getClosestVisibleAnchor(anchors);
      if (nextKey) setSelectedKey(nextKey);
    };

    window.addEventListener('hashchange', updateFromHash);
    window.addEventListener('scroll', updateFromScroll, { passive: true });
    updateFromHash();

    return () => {
      window.removeEventListener('hashchange', updateFromHash);
      window.removeEventListener('scroll', updateFromScroll);
    };
  }, [anchors]);

  return selectedKey;
}
