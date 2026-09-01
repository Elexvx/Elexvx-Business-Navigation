import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AppProviders } from '../src/app/AppProviders';
import AppShell from '../src/components/AppShell/AppShell';
import { NavigationDashboard } from '../src/components/NavigationDashboard/NavigationDashboard';
import { NavigationMenu } from '../src/components/NavigationMenu/NavigationMenu';
import { SearchPanel } from '../src/components/SearchPanel/SearchPanel';
import { siteConfig } from '../src/config/site';
import { fixtureNavigation } from './fixtures';

function renderWithProviders(element: React.ReactElement) {
  return render(<AppProviders>{element}</AppProviders>);
}

describe('navigation components', () => {
  it('renders all configured dashboard links and category headings', () => {
    renderWithProviders(<NavigationDashboard />);

    expect(screen.getAllByRole('link')).toHaveLength(33);
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(6);
    expect(screen.queryByText('链接总数')).not.toBeInTheDocument();
    expect(screen.queryByText('分类数量')).not.toBeInTheDocument();
    expect(screen.queryByText('可用')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/标签/)).not.toBeInTheDocument();
  }, 10_000);

  it('scrolls and updates the hash when a menu category is selected', async () => {
    render(
      <>
        <div id="category-category-two" />
        <NavigationMenu navigation={fixtureNavigation} selectedKey="category-category-one" />
      </>,
    );

    await userEvent.click(screen.getByText('Category Two'));

    expect(window.location.hash).toBe('#category-category-two');
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('supports internal suggestions and opens the best match from the search button', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue({ opener: null } as Window);
    const user = userEvent.setup();
    renderWithProviders(<SearchPanel />);

    const input = screen.getByRole('combobox', { name: '站内搜索' });
    await user.type(input, '企业官网');
    expect(await screen.findByRole('option', { name: /企业官网/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '执行搜索' }));

    expect(open).toHaveBeenCalledWith('https://www.elexvx.com/', '_blank', 'noopener,noreferrer');
  });

  it('switches to web search and sends an encoded query to the chosen engine', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue({ opener: null } as Window);
    const user = userEvent.setup();
    renderWithProviders(<SearchPanel />);

    await user.click(screen.getByRole('combobox', { name: '选择搜索源' }));
    await user.click(await screen.findByText('Bing'));
    const input = screen.getByRole('textbox', { name: '全网搜索' });
    await user.type(input, '中文 搜索');
    await user.keyboard('{Enter}');

    expect(open).toHaveBeenCalledWith(
      'https://www.bing.com/search?q=%E4%B8%AD%E6%96%87+%E6%90%9C%E7%B4%A2',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('closes the mobile drawer with Escape and restores focus', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AppShell
        navigation={siteConfig.navigation}
        searchPanel={<SearchPanel />}
        dashboard={<NavigationDashboard />}
      />,
    );

    const menuButton = screen.getByRole('button', { name: '打开导航菜单' });
    await user.click(menuButton);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(menuButton).toHaveFocus();
  });

  it('keeps the header brand as a logo-only link', () => {
    renderWithProviders(
      <AppShell
        navigation={siteConfig.navigation}
        searchPanel={<SearchPanel />}
        dashboard={<NavigationDashboard />}
      />,
    );

    const header = screen.getByRole('banner');
    expect(within(header).getByAltText(`${siteConfig.site.name} Logo`)).toBeVisible();
    expect(within(header).queryByText(siteConfig.site.name)).not.toBeInTheDocument();
    expect(within(header).queryByText(siteConfig.site.shortName)).not.toBeInTheDocument();
  });
});
