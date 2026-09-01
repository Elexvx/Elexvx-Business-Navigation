import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppProviders } from '../src/app/AppProviders';
import StatusPage from '../src/components/StatusPage/StatusPage';
import { createDemoStatusData } from '../server/status/demoData';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('status page', () => {
  it('renders grouped UptimeRobot data and working status controls', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        code: 200,
        message: 'success',
        source: 'demo',
        data: createDemoStatusData(60),
      }),
    }));
    const user = userEvent.setup();
    render(
      <AppProviders>
        <StatusPage />
      </AppProviders>,
    );

    expect(await screen.findByText('所有系统运行正常')).toBeInTheDocument();
    expect(screen.getByText('系统状态')).toBeInTheDocument();
    expect(screen.getByText('企业服务')).toBeInTheDocument();
    expect(screen.getByText('项目服务')).toBeInTheDocument();
    expect(screen.getByText('公共服务')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /查看历史记录/ })).toHaveAttribute(
      'href',
      '/status/history',
    );

    await user.click(screen.getByRole('button', { name: /订阅通知/ }));
    expect(await screen.findByRole('dialog', { name: '订阅服务通知' })).toBeInTheDocument();
  });

  it('shows the password form when the status API requires authentication', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        code: 401,
        message: '需要密码',
        source: 'api',
        passwordRequired: true,
      }),
    }));
    render(
      <AppProviders>
        <StatusPage />
      </AppProviders>,
    );

    expect(await screen.findByText('服务状态受保护')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('访问密码')).toBeInTheDocument();
  });
});
