export type MonitorState = 0 | 1 | 2 | 8 | 9;
export type MonitorType = 1 | 2 | 3 | 4 | 5;

export interface AvailabilityDay {
  date: number;
  percent: number;
  down: {
    times: number;
    duration: number;
  };
}

export interface StatusMonitor {
  id: number;
  name: string;
  url?: string;
  status: MonitorState;
  type: MonitorType;
  interval: number;
  percent: number;
  days: AvailabilityDay[];
  down: {
    times: number;
    duration: number;
  };
}

export interface StatusSummary {
  count: number;
  ok: number;
  error: number;
  unknown: number;
}

export interface StatusData {
  summary: StatusSummary;
  monitors: StatusMonitor[];
  timestamp: number;
}

export interface StatusApiResponse {
  code: number;
  message: string;
  source: 'api' | 'cache' | 'demo';
  data?: StatusData;
  passwordRequired?: boolean;
}
