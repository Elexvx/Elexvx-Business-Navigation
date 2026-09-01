import { describe, expect, it } from 'vitest';

import { resolveAppRoute, statusHistoryHref, statusHomeHref } from '../src/app/routes';
import {
  availabilityTone,
  groupStatusMonitors,
  monitorDisplayName,
  statusTone,
} from '../src/lib/status';
import { buildDateRanges, formatUptimeRobotData } from '../server/status/uptimeRobot';
import type { StatusMonitor } from '../src/types/status';

function monitor(overrides: Partial<StatusMonitor>): StatusMonitor {
  return {
    id: 1,
    name: 'A01-企业官网',
    status: 2,
    type: 1,
    interval: 300,
    percent: 100,
    days: [{ date: 1_700_000_000, percent: 100, down: { times: 0, duration: 0 } }],
    down: { times: 0, duration: 0 },
    ...overrides,
  };
}

describe('status routing and aggregation', () => {
  it('maps the status domain root and navigation subpaths to the status experience', () => {
    expect(resolveAppRoute('status.elexvx.com', '/')).toBe('status');
    expect(resolveAppRoute('status.elexvx.com', '/history')).toBe('status-history');
    expect(resolveAppRoute('nav.elexvx.com', '/status')).toBe('status');
    expect(resolveAppRoute('nav.elexvx.com', '/status/history')).toBe('status-history');
    expect(resolveAppRoute('nav.elexvx.com', '/')).toBe('navigation');
    expect(statusHomeHref('status.elexvx.com')).toBe('/');
    expect(statusHistoryHref('nav.elexvx.com')).toBe('/status/history');
  });

  it('groups monitors by configured prefix and derives aggregate status', () => {
    const groups = groupStatusMonitors(
      [monitor({ id: 1 }), monitor({ id: 2, name: 'B01-项目服务', status: 9 }), monitor({ id: 3, name: 'Other' })],
      [
        { id: 'enterprise', name: '企业服务', prefixes: ['A'] },
        { id: 'projects', name: '项目服务', prefixes: ['B'] },
      ],
    );
    expect(groups.map((group) => group.name)).toEqual(['企业服务', '项目服务', '其他服务']);
    expect(groups[1]).toMatchObject({ status: 9, percent: 100 });
    expect(monitorDisplayName('A01-企业官网')).toBe('企业官网');
    expect(statusTone(9)).toBe('error');
    expect(availabilityTone(99.5)).toBe('warning');
  });

  it('formats UptimeRobot ranges into chronological daily availability', () => {
    const ranges = buildDateRanges(7);
    const values = Array.from({ length: 7 }, () => '100').join('-');
    const data = formatUptimeRobotData(
      {
        monitors: [{
          id: 9,
          friendly_name: 'A01-企业官网',
          status: 2,
          type: 1,
          interval: 300,
          custom_uptime_ranges: `${values}-100`,
          logs: [],
        }],
      },
      ranges,
    );
    expect(data.summary).toEqual({ count: 1, ok: 1, error: 0, unknown: 0 });
    expect(data.monitors[0]?.days).toHaveLength(7);
    expect(data.monitors[0]?.days[0]?.date).toBeLessThan(data.monitors[0]?.days[6]?.date ?? 0);
  });
});
