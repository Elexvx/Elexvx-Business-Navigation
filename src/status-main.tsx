import AppShell from './components/AppShell/AppShell';
import StatusPage from './components/StatusPage/StatusPage';
import { resolveAppRoute } from './app/routes';
import { renderApplication } from './bootstrap';
import { siteConfig } from './config/site';

const route = resolveAppRoute(window.location.hostname, window.location.pathname);

renderApplication(
  <AppShell navigation={siteConfig.navigation} selectedNavigationKey="service-status">
    <StatusPage history={route === 'status-history'} />
  </AppShell>,
);
