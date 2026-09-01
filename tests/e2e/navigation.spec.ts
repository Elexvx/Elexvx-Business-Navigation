import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

type OpenedUrlsWindow = Window & { __openedUrls?: string[] };

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const openedUrls: string[] = [];
    Object.defineProperty(window, '__openedUrls', {
      configurable: true,
      value: openedUrls,
    });
    Object.defineProperty(window, 'open', {
      configurable: true,
      value: (url: string) => {
        openedUrls.push(String(url));
        return { opener: null };
      },
    });
  });
});

test('desktop renders the complete six-category navigation without overflow', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  await expect(page).toHaveTitle(/宏翔商道/);
  await expect(page.locator('.app-shell-header-menu')).toBeVisible();
  await expect(page.locator('.app-shell-header').getByText('宏翔商道', { exact: true })).toHaveCount(0);
  await expect(page.locator('.app-shell-header').getByText('企业导航', { exact: true })).toHaveCount(0);
  await expect(page.locator('main a[target="_blank"]')).toHaveCount(33);
  await expect(page.locator('[id^="category-"]')).toHaveCount(6);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

  const themeButtonBox = await page
    .getByRole('button', { name: '切换到深色模式' })
    .boundingBox();
  expect(themeButtonBox).not.toBeNull();
  expect(themeButtonBox?.width).toBe(themeButtonBox?.height);

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
  expect(consoleErrors).toEqual([]);

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});

test('mobile drawer closes by Escape, mask and menu selection', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.locator('.app-shell-sider')).toHaveCount(0);
  const menuButton = page.getByRole('button', { name: '打开导航菜单' });
  await menuButton.click();
  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();

  const drawerSurfaces = await page.evaluate(() => {
    const body = document.querySelector<HTMLElement>('.ant-drawer-body');
    const menu = document.querySelector<HTMLElement>('.app-shell-drawer-menu');
    if (!body || !menu) return null;
    const bodyStyle = getComputedStyle(body);
    const menuStyle = getComputedStyle(menu);
    return {
      bodyWidth: body.getBoundingClientRect().width,
      menuBackground: menuStyle.backgroundColor,
      menuWidth: menu.getBoundingClientRect().width,
      paddingLeft: bodyStyle.paddingLeft,
      paddingRight: bodyStyle.paddingRight,
    };
  });
  expect(drawerSurfaces).toEqual({
    bodyWidth: 256,
    menuBackground: 'rgba(0, 0, 0, 0)',
    menuWidth: 232,
    paddingLeft: '12px',
    paddingRight: '12px',
  });

  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(menuButton).toBeFocused();

  await menuButton.click();
  await expect(drawer).toBeVisible();
  // The left drawer occupies the first 256px; click the exposed mask area.
  await page.locator('.ant-drawer-mask').click({ position: { x: 300, y: 10 } });
  await expect(drawer).toBeHidden();

  await menuButton.click();
  await expect(drawer).toBeVisible();
  await drawer.getByText('企业系统', { exact: true }).click();
  await expect(drawer).toBeHidden();
});

test('theme preference and both search modes persist and stub external tabs', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const themeButton = page.getByRole('button', { name: '切换到深色模式' });
  await themeButton.click();
  await expect(page.getByRole('button', { name: '切换到浅色模式' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');
  await expect.poll(() => page.evaluate(() => {
    const header = document.querySelector<HTMLElement>('.app-shell-header');
    const button = document.querySelector<HTMLElement>('.app-shell-theme-button');
    if (!header || !button) return false;
    return getComputedStyle(button).backgroundColor === getComputedStyle(header).backgroundColor;
  })).toBe(true);

  const darkHeaderSurfaces = await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>('.app-shell-header');
    const menu = document.querySelector<HTMLElement>('.app-shell-header-menu');
    const selectedItem = document.querySelector<HTMLElement>(
      '.app-shell-header-menu .ant-menu-item-selected',
    );
    const button = document.querySelector<HTMLElement>('.app-shell-theme-button');

    return {
      button: button ? getComputedStyle(button).backgroundColor : '',
      header: header ? getComputedStyle(header).backgroundColor : '',
      menu: menu ? getComputedStyle(menu).backgroundColor : '',
      selectedBorder: selectedItem ? getComputedStyle(selectedItem).borderBottomColor : '',
      selectedColor: selectedItem ? getComputedStyle(selectedItem).color : '',
      selectedItem: selectedItem ? getComputedStyle(selectedItem).backgroundColor : '',
    };
  });
  expect(darkHeaderSurfaces.menu).toBe(darkHeaderSurfaces.header);
  expect(darkHeaderSurfaces.button).toBe(darkHeaderSurfaces.header);
  expect(darkHeaderSurfaces.selectedItem).toBe('rgba(0, 0, 0, 0)');
  expect(darkHeaderSurfaces.selectedColor).toBe('rgb(105, 177, 255)');
  expect(darkHeaderSurfaces.selectedBorder).toBe(darkHeaderSurfaces.selectedColor);

  const internalInput = page.getByRole('combobox', { name: '站内搜索' });
  await internalInput.fill('企业官网');
  await internalInput.press('ArrowDown');
  await internalInput.press('Enter');
  const internalOpened = await page.evaluate(
    () => (window as OpenedUrlsWindow).__openedUrls ?? [],
  );
  expect(internalOpened.filter((url) => url === 'https://www.elexvx.com/')).toHaveLength(1);

  const sourceSelect = page.getByRole('combobox', { name: '选择搜索源' });
  await sourceSelect.click();
  await sourceSelect.press('ArrowDown');
  await sourceSelect.press('Enter');
  const webInput = page.getByRole('textbox', { name: '全网搜索' });
  await webInput.fill('中文 搜索');
  await webInput.press('Enter');
  const openedUrls = await page.evaluate(() => (window as OpenedUrlsWindow).__openedUrls ?? []);
  expect(openedUrls).toContain('https://www.bing.com/search?q=%E4%B8%AD%E6%96%87+%E6%90%9C%E7%B4%A2');

  await page.reload();
  await expect(page.getByRole('button', { name: '切换到浅色模式' })).toBeVisible();
});

test('status page matches the compact desktop design and exposes working history', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/status');

  await expect(page).toHaveTitle('宏翔商道服务状态');
  await expect(page.locator('.app-shell-header-menu')).toBeVisible();
  await expect(page.locator('.app-shell-header-menu .ant-menu-item-selected')).toContainText('服务状态');
  await expect(page.getByRole('link', { name: '企业系统' })).toHaveAttribute('href', /#category-/);
  await expect(page.getByText('所有系统运行正常')).toBeVisible();
  await expect(page.getByText('系统状态')).toBeVisible();
  await expect(page.getByText('企业服务', { exact: true })).toBeVisible();
  await expect(page.getByText('项目服务', { exact: true })).toBeVisible();
  await expect(page.getByText('公共服务', { exact: true })).toBeVisible();
  await expect(page.getByText('企业官网', { exact: true })).toBeVisible();
  await expect(page.getByLabel('企业官网最近 60 天可用性')).toBeVisible();

  const groupAvailability = await page.getByLabel('企业服务最近 60 天可用性').boundingBox();
  const monitorAvailability = await page.getByLabel('企业官网最近 60 天可用性').boundingBox();
  const groupName = await page.getByText('企业服务', { exact: true }).boundingBox();
  const monitorName = await page.getByText('企业官网', { exact: true }).boundingBox();
  expect(groupAvailability).not.toBeNull();
  expect(monitorAvailability).not.toBeNull();
  expect(groupName).not.toBeNull();
  expect(monitorName).not.toBeNull();
  expect(monitorName!.x - groupName!.x).toBeGreaterThanOrEqual(20);
  expect(monitorName!.x - groupName!.x).toBeLessThanOrEqual(30);
  expect(groupAvailability!.x).toBeLessThanOrEqual(410);
  expect(Math.abs(groupAvailability!.x - monitorAvailability!.x)).toBeLessThanOrEqual(1);
  expect(
    Math.abs(
      (groupAvailability!.x + groupAvailability!.width)
      - (monitorAvailability!.x + monitorAvailability!.width),
    ),
  ).toBeLessThanOrEqual(1);

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
  expect(consoleErrors).toEqual([]);

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);

  await page.getByRole('link', { name: /查看历史记录/ }).click();
  await expect(page).toHaveURL(/\/status\/history$/);
  await expect(page.getByRole('heading', { name: '历史可用性', level: 1 })).toBeVisible();
});

test('status page keeps the mobile hierarchy compact without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/status');

  await expect(page.getByText('所有系统运行正常')).toBeVisible();
  await expect(page.getByText('企业服务', { exact: true })).toBeVisible();
  await expect(page.getByLabel('企业服务最近 60 天可用性')).toBeHidden();
  await expect(page.getByText('企业官网', { exact: true })).toBeVisible();
  await expect(page.getByLabel('企业官网最近 60 天可用性')).toBeHidden();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);

  await expect(page.getByRole('button', { name: /订阅通知/ })).toHaveCount(0);
});
