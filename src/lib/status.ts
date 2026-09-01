import type { StatusGroupConfig } from '../types/site';
import type { AvailabilityDay, MonitorState, StatusMonitor } from '../types/status';

export type StatusTone = 'healthy' | 'warning' | 'error' | 'unknown';

export interface StatusGroup {
  id: string;
  name: string;
  monitors: StatusMonitor[];
  percent: number;
  status: MonitorState;
  days: AvailabilityDay[];
}

export function monitorDisplayName(name: string): string {
  return name.replace(/^[A-Za-z]+\d+\s*[-—]\s*/, '').trim() || name;
}

function monitorPrefix(name: string): string | undefined {
  return /^([A-Za-z]+)\d+/.exec(name.trim())?.[1]?.toLocaleUpperCase();
}

export function statusTone(status: MonitorState): StatusTone {
  if (status === 2) return 'healthy';
  if (status === 8 || status === 9) return 'error';
  return 'unknown';
}

export function availabilityTone(percent: number): StatusTone {
  if (percent >= 99.9) return 'healthy';
  if (percent >= 95) return 'warning';
  if (percent > 0) return 'error';
  return 'unknown';
}

function aggregateStatus(monitors: StatusMonitor[]): MonitorState {
  if (monitors.some((monitor) => monitor.status === 8 || monitor.status === 9)) return 9;
  if (monitors.some((monitor) => monitor.status !== 2)) return 1;
  return 2;
}

function aggregateDays(monitors: StatusMonitor[]): AvailabilityDay[] {
  const byDate = new Map<number, AvailabilityDay[]>();
  for (const monitor of monitors) {
    for (const day of monitor.days) {
      const entries = byDate.get(day.date) ?? [];
      entries.push(day);
      byDate.set(day.date, entries);
    }
  }

  return [...byDate.entries()]
    .sort(([left], [right]) => left - right)
    .map(([date, days]) => ({
      date,
      percent: Number((days.reduce((total, day) => total + day.percent, 0) / days.length).toFixed(2)),
      down: days.reduce(
        (total, day) => ({
          times: total.times + day.down.times,
          duration: total.duration + day.down.duration,
        }),
        { times: 0, duration: 0 },
      ),
    }));
}

function createGroup(id: string, name: string, monitors: StatusMonitor[]): StatusGroup {
  return {
    id,
    name,
    monitors,
    percent: monitors.length > 0
      ? Number((monitors.reduce((total, monitor) => total + monitor.percent, 0) / monitors.length).toFixed(2))
      : 0,
    status: aggregateStatus(monitors),
    days: aggregateDays(monitors),
  };
}

export function groupStatusMonitors(
  monitors: StatusMonitor[],
  definitions: StatusGroupConfig[],
): StatusGroup[] {
  const claimed = new Set<number>();
  const groups = definitions.flatMap((definition) => {
    const prefixes = new Set(definition.prefixes.map((prefix) => prefix.toLocaleUpperCase()));
    const matching = monitors.filter((monitor) => {
      const matches = prefixes.has(monitorPrefix(monitor.name) ?? '');
      if (matches) claimed.add(monitor.id);
      return matches;
    });
    return matching.length > 0 ? [createGroup(definition.id, definition.name, matching)] : [];
  });
  const remaining = monitors.filter((monitor) => !claimed.has(monitor.id));
  if (remaining.length > 0) groups.push(createGroup('other-services', '其他服务', remaining));
  return groups;
}

export function formatPercent(percent: number): string {
  return `${percent.toFixed(percent === Math.round(percent) ? 0 : 2)}%`;
}

export function formatStatusTime(timestamp: number): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(timestamp));
}

export function formatDay(timestamp: number): string {
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(
    new Date(timestamp * 1000),
  );
}
