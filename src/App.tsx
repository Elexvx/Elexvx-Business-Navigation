import { SearchPanel } from './components/SearchPanel/SearchPanel';
import { NavigationDashboard } from './components/NavigationDashboard/NavigationDashboard';
import AppShell from './components/AppShell/AppShell';
import { siteConfig } from './config/site';

export default function App() {
  return (
    <AppShell
      navigation={siteConfig.navigation}
      searchPanel={<SearchPanel />}
      dashboard={<NavigationDashboard />}
    />
  );
}
