import { lazy, Suspense } from 'react';
import { Spin } from 'antd';

import { SearchPanel } from './components/SearchPanel/SearchPanel';
import { NavigationDashboard } from './components/NavigationDashboard/NavigationDashboard';
import AppShell from './components/AppShell/AppShell';
import { siteConfig } from './config/site';
import { resolveAppRoute } from './app/routes';

const StatusPage = lazy(() => import('./components/StatusPage/StatusPage'));

export default function App() {
  const route = resolveAppRoute(window.location.hostname, window.location.pathname);

  if (route === 'status' || route === 'status-history') {
    return (
      <AppShell navigation={siteConfig.navigation} selectedNavigationKey="service-status">
        <Suspense fallback={<div className="route-loading"><Spin size="large" /></div>}>
          <StatusPage history={route === 'status-history'} />
        </Suspense>
      </AppShell>
    );
  }

  return (
    <AppShell
      navigation={siteConfig.navigation}
      searchPanel={<SearchPanel />}
      dashboard={<NavigationDashboard />}
    />
  );
}
