import {
  AppstoreOutlined,
  DashboardOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import { useMemo } from 'react';

import {
  categoryAnchorId,
  navigationKeyForCategory,
  navigationKeyForSubcategory,
} from '../../app/useActiveNavigation';
import type { NavigationCategory } from '../../types/site';

export interface NavigationMenuProps {
  navigation: NavigationCategory[];
  selectedKey?: string;
  onNavigate?: (key: string) => void;
  onNavigationComplete?: () => void;
  theme?: 'light' | 'dark';
  className?: string;
  mode?: MenuProps['mode'];
}

function scrollToAnchor(id: string): void {
  const element = document.getElementById(id);

  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (window.location.hash !== `#${id}`) {
    window.history.pushState({}, '', `#${encodeURIComponent(id)}`);
    window.dispatchEvent(new Event('hashchange'));
  }
}

export function NavigationMenu({
  navigation,
  selectedKey,
  onNavigate,
  onNavigationComplete,
  theme = 'light',
  className,
  mode = 'inline',
}: NavigationMenuProps) {
  const items = useMemo<MenuProps['items']>(
    () =>
      [
        ...navigation.map((category) => {
        const categoryKey = navigationKeyForCategory(category);
        const categoryAnchor = categoryAnchorId(category);

        if (category.subcategories.length === 0) {
          return {
            key: categoryKey,
            icon: mode === 'inline' ? <AppstoreOutlined /> : undefined,
            label: category.category,
          };
        }

        return {
          key: categoryKey,
          icon: mode === 'inline' ? <AppstoreOutlined /> : undefined,
          label: category.category,
          children: category.subcategories.map((subcategory) => {
            const subcategoryKey = navigationKeyForSubcategory(category.id, subcategory.id);
            return {
              key: subcategoryKey,
              icon: mode === 'inline' ? <FolderOpenOutlined /> : undefined,
              label: `${subcategory.name}（${subcategory.links.length}）`,
            };
          }),
          onTitleClick: () => {
            scrollToAnchor(categoryAnchor);
            onNavigate?.(categoryKey);
            onNavigationComplete?.();
          },
        };
        }),
        {
          key: 'service-status',
          icon: mode === 'inline' ? <DashboardOutlined /> : undefined,
          label: <a href="/status">服务状态</a>,
        },
      ],
    [mode, navigation, onNavigate, onNavigationComplete],
  );

  const handleClick: MenuProps['onClick'] = ({ key }) => {
    const anchorId = key.startsWith('subcategory-')
      ? key
      : key.startsWith('category-')
        ? key
        : undefined;

    if (!anchorId) return;

    scrollToAnchor(anchorId);
    onNavigate?.(key);
    onNavigationComplete?.();
  };

  return (
    <Menu
      aria-label="导航分类"
      className={className}
      items={items}
      mode={mode}
      onClick={handleClick}
      selectedKeys={selectedKey ? [selectedKey] : undefined}
      theme={theme}
      inlineIndent={mode === 'inline' ? 20 : undefined}
      defaultOpenKeys={mode === 'inline'
        ? navigation
            .filter((category) => category.subcategories.length > 0)
            .map(navigationKeyForCategory)
        : undefined}
    />
  );
}

export default NavigationMenu;
