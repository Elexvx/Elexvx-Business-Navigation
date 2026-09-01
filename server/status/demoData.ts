import type { AvailabilityDay, MonitorState, StatusData, StatusMonitor } from './types.ts';

const demoMonitors = [
  ['A01-企业官网', 'https://www.elexvx.com/'],
  ['A02-企业外链统一管理系统', 'https://nav.elexvx.com/'],
  ['A03-ACC系统', 'https://it.elexvx.com/'],
  ['A05-创新产业研发中心', 'https://ai.elexvx.com/'],
  ['A06-测试服务器', 'https://example.com/'],
  ['A07-期刊管理系统（海外）', 'https://example.com/'],
  ['B01-项目一-他到底几个鱼塘', 'https://example.com/'],
  ['B02-项目二-AI短剧协作平台', 'https://example.com/'],
  ['J01-Blog', 'https://blog.elexvx.com/'],
] as const;

function createDays(historyDays: number, monitorIndex: number): AvailabilityDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: historyDays }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (historyDays - index - 1));
    const hasWarning = (index + monitorIndex * 11) % 37 === 0;
    return {
      date: Math.floor(date.getTime() / 1000),
      percent: hasWarning ? 99.62 : 100,
      down: hasWarning ? { times: 1, duration: 164 } : { times: 0, duration: 0 },
    };
  });
}

export function createDemoStatusData(historyDays = 60): StatusData {
  const monitors: StatusMonitor[] = demoMonitors.map(([name, url], index) => {
    const days = createDays(historyDays, index);
    const down = days.reduce(
      (total, day) => ({
        times: total.times + day.down.times,
        duration: total.duration + day.down.duration,
      }),
      { times: 0, duration: 0 },
    );
    const percent = Number(
      (days.reduce((total, day) => total + day.percent, 0) / days.length).toFixed(2),
    );

    return {
      id: index + 1,
      name,
      url,
      status: 2 as MonitorState,
      type: 1,
      interval: 300,
      percent,
      days,
      down,
    };
  });

  return {
    summary: { count: monitors.length, ok: monitors.length, error: 0, unknown: 0 },
    monitors,
    timestamp: Date.now(),
  };
}
