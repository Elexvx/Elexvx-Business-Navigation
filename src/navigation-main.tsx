import AppShell from './components/AppShell/AppShell';
import { NavigationDashboard } from './components/NavigationDashboard/NavigationDashboard';
import { SearchPanel } from './components/SearchPanel/SearchPanel';
import { renderApplication } from './bootstrap';
import { siteConfig } from './config/site';

renderApplication(
  <AppShell
    navigation={siteConfig.navigation}
    searchPanel={<SearchPanel />}
    dashboard={<NavigationDashboard />}
  />,
);
