import {
  CloseOutlined,
  MenuOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons';
import {
  Button,
  ConfigProvider,
  Drawer,
  Grid,
  Layout,
  Tooltip,
  Typography,
} from 'antd';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useThemeMode } from '../../app/AppProviders';
import { navigationHomeHref, statusHomeHref } from '../../app/routes';
import { useActiveNavigation } from '../../app/useActiveNavigation';
import { siteConfig } from '../../config/site';
import type { NavigationCategory } from '../../types/site';
import NavigationMenu from '../NavigationMenu/NavigationMenu';

const { Content, Footer, Header } = Layout;
const { useBreakpoint } = Grid;

export interface AppShellProps {
  navigation: NavigationCategory[];
  searchPanel?: ReactNode;
  dashboard?: ReactNode;
  children?: ReactNode;
  selectedNavigationKey?: string;
}

function Brand({
  compact = false,
  href,
  showText = true,
}: {
  compact?: boolean;
  href: string;
  showText?: boolean;
}) {
  return (
    <a className={`app-shell-brand${compact ? ' app-shell-brand-compact' : ''}`} href={href}>
      <img src={siteConfig.site.logo} alt={`${siteConfig.site.name} Logo`} />
      {showText ? (
        <div>
          <Typography.Text className="app-shell-brand-name" strong>
            {siteConfig.site.name}
          </Typography.Text>
          <Typography.Text className="app-shell-brand-short-name" type="secondary">
            {siteConfig.site.shortName}
          </Typography.Text>
        </div>
      ) : null}
    </a>
  );
}

export function AppShell({
  navigation,
  searchPanel,
  dashboard,
  children,
  selectedNavigationKey,
}: AppShellProps) {
  const screens = useBreakpoint();
  const isDesktop = Boolean(screens.lg);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const activeNavigationKey = useActiveNavigation(navigation);
  const selectedKey = selectedNavigationKey ?? activeNavigationKey;
  const { mode, toggleMode } = useThemeMode();
  const hostname = window.location.hostname;
  const navigationHref = navigationHomeHref(hostname);
  const statusHref = statusHomeHref(hostname);
  const navigationHrefBase = selectedNavigationKey === 'service-status'
    ? navigationHref
    : undefined;

  const restoreMenuFocus = useCallback(() => {
    // Drawer motion/focus-lock can move focus to body after the first frame;
    // the delayed retry runs after the close transition completes.
    window.requestAnimationFrame(() => menuButtonRef.current?.focus());
    window.setTimeout(() => menuButtonRef.current?.focus(), 350);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    restoreMenuFocus();
  }, [restoreMenuFocus]);

  useEffect(() => {
    if (isDesktop) setMobileMenuOpen(false);
  }, [isDesktop]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMobileMenu();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeMobileMenu, mobileMenuOpen]);

  const handleDrawerChange = (open: boolean) => {
    setMobileMenuOpen(open);
    if (!open) restoreMenuFocus();
  };

  const themeLabel = mode === 'dark' ? '切换到浅色模式' : '切换到深色模式';

  return (
    <Layout className="app-shell">
      <Header className="app-shell-header">
        <div className="app-shell-header-leading">
          {!isDesktop ? (
            <Button
              ref={menuButtonRef}
              aria-label="打开导航菜单"
              className="app-shell-menu-button"
              icon={<MenuOutlined />}
              onClick={() => setMobileMenuOpen(true)}
              type="text"
            />
          ) : null}
          <Brand compact={!isDesktop} href={navigationHref} showText={false} />
        </div>

        {isDesktop ? (
          <ConfigProvider
            theme={{
              components: {
                Menu: {
                  darkItemBg: '#182235',
                  darkItemHoverBg: 'transparent',
                  darkItemSelectedColor: '#69b1ff',
                  darkItemSelectedBg: 'transparent',
                  horizontalItemBorderRadius: 0,
                  horizontalItemHoverBg: 'transparent',
                  horizontalItemHoverColor: mode === 'dark' ? '#69b1ff' : '#0958d9',
                  horizontalItemSelectedBg: 'transparent',
                  horizontalItemSelectedColor: mode === 'dark' ? '#69b1ff' : '#0958d9',
                  itemBg: mode === 'dark' ? '#182235' : '#ffffff',
                },
              },
            }}
          >
            <NavigationMenu
              className="app-shell-header-menu"
              mode="horizontal"
              navigation={navigation}
              navigationHrefBase={navigationHrefBase}
              selectedKey={selectedKey}
              statusHref={statusHref}
              theme={mode}
            />
          </ConfigProvider>
        ) : null}

        <Tooltip title={themeLabel}>
          <Button
            aria-label={themeLabel}
            className="app-shell-theme-button"
            icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleMode}
            shape="circle"
            type="text"
          />
        </Tooltip>
      </Header>

      <Content className="app-shell-content">
        {children ?? (
          <>
            <section className="app-shell-hero" aria-labelledby="portal-title">
              <div className="app-shell-hero-inner">
                <div className="app-shell-hero-heading">
                  <Typography.Title id="portal-title" level={1}>
                    企业服务导航
                  </Typography.Title>
                </div>
                <Typography.Paragraph className="app-shell-hero-description" type="secondary">
                  汇聚企业内部系统与外部政务服务，一站直达，高效协同。
                </Typography.Paragraph>
                <div className="app-shell-hero-search">{searchPanel}</div>
              </div>
            </section>

            <div className="app-shell-directory">
              {dashboard}
            </div>
          </>
        )}
      </Content>

      <Footer className="app-shell-footer">
        <Typography.Text type="secondary">
          {new Date().getFullYear()} © {siteConfig.site.copyright}
        </Typography.Text>
        {siteConfig.site.icp ? (
          <>
            <Typography.Text type="secondary"> · </Typography.Text>
            <Typography.Link href="https://beian.miit.gov.cn/" rel="noreferrer" target="_blank">
              ICP备案：{siteConfig.site.icp}
            </Typography.Link>
          </>
        ) : null}
      </Footer>

      <Drawer
        afterOpenChange={(open) => {
          if (!open) {
            restoreMenuFocus();
          }
        }}
        closeIcon={<CloseOutlined />}
        destroyOnHidden
        mask={{ closable: true }}
        onClose={() => handleDrawerChange(false)}
        open={mobileMenuOpen && !isDesktop}
        placement="left"
        rootClassName="app-shell-drawer"
        title={<Brand compact href={navigationHref} />}
        size={256}
        styles={{ body: { padding: '8px 12px 24px' } }}
      >
        <NavigationMenu
          className="app-shell-drawer-menu"
          navigation={navigation}
          navigationHrefBase={navigationHrefBase}
          onNavigationComplete={closeMobileMenu}
          selectedKey={selectedKey}
          statusHref={statusHref}
          theme={mode}
          mode="inline"
        />
      </Drawer>
    </Layout>
  );
}

export default AppShell;
