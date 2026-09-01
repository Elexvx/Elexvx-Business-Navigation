import type {
  AvailabilityDay,
  MonitorState,
  MonitorType,
  StatusData,
  StatusMonitor,
} from './types.ts';

interface UptimeRobotLog {
  type?: number;
  datetime?: number;
  duration?: number;
}

interface UptimeRobotMonitor {
  id?: number;
  friendly_name?: string;
  url?: string;
  status?: number;
  type?: number;
  interval?: number;
  custom_uptime_ranges?: string;
  logs?: UptimeRobotLog[];
}

interface UptimeRobotResponse {
  stat?: string;
  monitors?: UptimeRobotMonitor[];
  error?: { message?: string };
}

interface DateRangeRequest {
  dates: Date[];
  start: number;
  end: number;
  ranges: string;
}

interface StatusCache {
  expiresAt: number;
  staleUntil: number;
  data: StatusData;
}

interface RangeBatch {
  ranges: string;
  dayCount: number;
  includesOverall: boolean;
}

let cache: StatusCache | undefined;
let inFlightRequest: Promise<StatusData> | undefined;

function startOfToday(): Date {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
}

export function buildDateRanges(historyDays: number): DateRangeRequest {
  const today = startOfToday();
  const dates = Array.from({ length: historyDays }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    return date;
  });
  const rangeValues = dates.map((date) => {
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    return `${Math.floor(date.getTime() / 1000)}_${Math.floor(nextDay.getTime() / 1000)}`;
  });
  const oldest = dates.at(-1) ?? today;
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const start = Math.floor(oldest.getTime() / 1000);
  const end = Math.floor(tomorrow.getTime() / 1000);
  rangeValues.push(`${start}_${end}`);

  return { dates, start, end, ranges: rangeValues.join('-') };
}

function formatPercent(value: string | number | undefined): number {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(100, Math.max(0, Number(numeric.toFixed(2))));
}

function dateKeyFromUnix(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function createRangeBatches(ranges: DateRangeRequest, batchSize: number): RangeBatch[] {
  const values = ranges.ranges.split('-');
  const overall = values.pop();
  if (!overall) throw new Error('无法生成 UptimeRobot 时间范围');

  const batches: RangeBatch[] = [];
  for (let index = 0; index < values.length; index += batchSize) {
    const days = values.slice(index, index + batchSize);
    const includesOverall = index === 0;
    batches.push({
      ranges: [...days, ...(includesOverall ? [overall] : [])].join('-'),
      dayCount: days.length,
      includesOverall,
    });
  }
  return batches;
}

function mergeBatchResponses(
  responses: UptimeRobotResponse[],
  batches: RangeBatch[],
): UptimeRobotResponse {
  const baseMonitors = responses[0]?.monitors;
  if (!Array.isArray(baseMonitors)) return responses[0] ?? {};
  if (responses.length === 1) return responses[0];

  return {
    ...responses[0],
    monitors: baseMonitors.map((baseMonitor, monitorIndex) => {
      const dailyValues: string[] = [];
      let overallValue = '0';

      responses.forEach((response, batchIndex) => {
        const monitor = response.monitors?.find((item) => item.id === baseMonitor.id)
          ?? response.monitors?.[monitorIndex];
        if (!monitor) throw new Error('UptimeRobot 分批响应缺少监控数据');
        const values = (monitor.custom_uptime_ranges ?? '').split('-');
        if (batches[batchIndex]?.includesOverall) overallValue = values.pop() ?? '0';
        dailyValues.push(...values.slice(0, batches[batchIndex]?.dayCount));
      });

      return {
        ...baseMonitor,
        custom_uptime_ranges: `${dailyValues.join('-')}-${overallValue}`,
      };
    }),
  };
}

export function formatUptimeRobotData(
  response: UptimeRobotResponse,
  ranges: DateRangeRequest,
): StatusData {
  if (!Array.isArray(response.monitors)) {
    throw new Error(response.error?.message || 'UptimeRobot 未返回监控数据');
  }

  const monitors: StatusMonitor[] = response.monitors.map((monitor, monitorIndex) => {
    const values = (monitor.custom_uptime_ranges ?? '').split('-');
    const percent = formatPercent(values.pop());
    const dateIndex = new Map<string, number>();
    const days: AvailabilityDay[] = ranges.dates.map((date, index) => {
      dateIndex.set(dateKeyFromUnix(Math.floor(date.getTime() / 1000)), index);
      return {
        date: Math.floor(date.getTime() / 1000),
        percent: formatPercent(values[index]),
        down: { times: 0, duration: 0 },
      };
    });
    const down = { times: 0, duration: 0 };

    for (const log of monitor.logs ?? []) {
      if (log.type !== 1 && log.type !== 99) continue;
      const duration = Math.max(0, Number(log.duration ?? 0));
      const dayIndex = dateIndex.get(dateKeyFromUnix(Number(log.datetime ?? 0)));
      if (dayIndex !== undefined) {
        days[dayIndex].down.times += 1;
        days[dayIndex].down.duration += duration;
      }
      down.times += 1;
      down.duration += duration;
    }

    return {
      id: Number(monitor.id ?? monitorIndex + 1),
      name: monitor.friendly_name?.trim() || `监控项目 ${monitorIndex + 1}`,
      ...(monitor.url ? { url: monitor.url } : {}),
      status: (monitor.status ?? 8) as MonitorState,
      type: (monitor.type ?? 1) as MonitorType,
      interval: Number(monitor.interval ?? 0),
      percent,
      days: days.reverse(),
      down,
    };
  });

  const summary = monitors.reduce(
    (total, monitor) => {
      if (monitor.status === 2) total.ok += 1;
      else if (monitor.status === 8 || monitor.status === 9) total.error += 1;
      else total.unknown += 1;
      return total;
    },
    { count: monitors.length, ok: 0, error: 0, unknown: 0 },
  );

  return { summary, monitors, timestamp: Date.now() };
}

export async function fetchStatusData(options: {
  apiKey: string;
  apiUrl?: string;
  historyDays?: number;
  cacheTtlMs?: number;
  staleTtlMs?: number;
  timeoutMs?: number;
  rangeBatchSize?: number;
}): Promise<{ data: StatusData; source: 'api' | 'cache' }> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return { data: cache.data, source: 'cache' };

  if (inFlightRequest) {
    try {
      return { data: await inFlightRequest, source: 'cache' };
    } catch (error) {
      if (cache && cache.staleUntil > Date.now()) {
        return { data: cache.data, source: 'cache' };
      }
      throw error;
    }
  }

  const historyDays = options.historyDays ?? 60;
  const ranges = buildDateRanges(historyDays);
  inFlightRequest = (async () => {
    const batches = createRangeBatches(ranges, options.rangeBatchSize ?? 20);
    const apiBaseUrl = options.apiUrl ?? 'https://api.uptimerobot.com/v2/';
    const apiUrl = `${apiBaseUrl.replace(/\/+$/, '')}/getMonitors`;
    const payloads = await Promise.all(batches.map(async (batch) => {
      const body = new URLSearchParams({
        api_key: options.apiKey,
        format: 'json',
        custom_uptime_ranges: batch.ranges,
      });
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(options.timeoutMs ?? 20_000),
      });

      if (!response.ok) throw new Error(`UptimeRobot 请求失败（${response.status}）`);
      return (await response.json()) as UptimeRobotResponse;
    }));
    const payload = mergeBatchResponses(payloads, batches);
    return formatUptimeRobotData(payload, ranges);
  })();

  try {
    const data = await inFlightRequest;
    const completedAt = Date.now();
    cache = {
      data,
      expiresAt: completedAt + (options.cacheTtlMs ?? 300_000),
      staleUntil: completedAt + (options.staleTtlMs ?? 86_400_000),
    };
    return { data, source: 'api' };
  } catch (error) {
    if (cache && cache.staleUntil > Date.now()) {
      return { data: cache.data, source: 'cache' };
    }
    throw error;
  } finally {
    inFlightRequest = undefined;
  }
}

export function resetStatusCacheForTests() {
  cache = undefined;
  inFlightRequest = undefined;
}
