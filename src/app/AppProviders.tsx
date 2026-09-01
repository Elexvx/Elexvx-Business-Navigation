import {
  App as AntdApp,
  ConfigProvider,
  theme as antdTheme,
} from 'antd';
import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import zhCN from 'antd/locale/zh_CN';

export const THEME_STORAGE_KEY = 'theme';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';

  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function useThemeMode(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useThemeMode must be used inside AppProviders');
  }

  return context;
}

export function AppProviders({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<ThemeMode>(getStoredTheme);
  const activeMode: ThemeMode = mode;

  useEffect(() => {
    document.documentElement.dataset.theme = activeMode;
    document.documentElement.style.colorScheme = activeMode;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // Storage can be unavailable in privacy-restricted browser contexts.
    }
  }, [activeMode, mode]);

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      mode: activeMode,
      setMode,
      toggleMode: () => setMode((currentMode) => (currentMode === 'dark' ? 'light' : 'dark')),
    }),
    [activeMode],
  );

  const algorithm = activeMode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm;

  return (
    <ThemeContext.Provider value={contextValue}>
      <ConfigProvider
        locale={zhCN}
        theme={{
          algorithm,
          components: {
            Card: {
              borderRadiusLG: 10,
            },
            Layout: {
              footerBg: activeMode === 'dark' ? '#111827' : '#f8f9fc',
              headerBg: activeMode === 'dark' ? '#111827' : '#ffffff',
              siderBg: activeMode === 'dark' ? '#111827' : '#fbfcff',
            },
            Menu: {
              darkItemBg: 'transparent',
              darkItemHoverBg: '#23324d',
              darkItemSelectedBg: '#26466b',
              darkItemSelectedColor: '#d6e9ff',
              darkSubMenuItemBg: 'transparent',
              itemBorderRadius: 6,
              itemHoverBg: activeMode === 'dark' ? '#1f2937' : '#f2f6ff',
              itemSelectedBg: activeMode === 'dark' ? '#1e3a5f' : '#eaf3ff',
              itemSelectedColor: activeMode === 'dark' ? '#b7d9ff' : '#0958d9',
            },
          },
          token: {
            colorBgLayout: activeMode === 'dark' ? '#0f172a' : '#ffffff',
            colorBgContainer: activeMode === 'dark' ? '#182235' : '#ffffff',
            colorBgElevated: activeMode === 'dark' ? '#1f2a44' : '#ffffff',
            colorBorder: activeMode === 'dark' ? '#334155' : '#e5eaf2',
            colorBorderSecondary: activeMode === 'dark' ? '#29364d' : '#e8edf3',
            colorPrimary: activeMode === 'dark' ? '#69b1ff' : '#0958d9',
            colorInfo: activeMode === 'dark' ? '#69b1ff' : '#0958d9',
            colorLink: activeMode === 'dark' ? '#69b1ff' : '#0958d9',
            colorError: activeMode === 'dark' ? '#ff7875' : '#a8071a',
            colorSuccess: activeMode === 'dark' ? '#95de64' : '#237804',
            colorSuccessBg: activeMode === 'dark' ? '#162312' : '#f6ffed',
            colorWarning: activeMode === 'dark' ? '#ffd666' : '#ad6800',
            colorTextSecondary: activeMode === 'dark' ? '#bfbfbf' : '#595959',
            colorTextTertiary: activeMode === 'dark' ? '#8c8c8c' : '#595959',
            colorTextQuaternary: activeMode === 'dark' ? '#8c8c8c' : '#595959',
            borderRadius: 8,
          },
        }}
      >
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}
