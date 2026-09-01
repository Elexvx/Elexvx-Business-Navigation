import { useCallback, useEffect, useRef, useState } from 'react';

import { siteConfig } from '../../config/site';
import type { StatusApiResponse, StatusData } from '../../types/status';

interface StatusDataState {
  data?: StatusData;
  error?: string;
  loading: boolean;
  refreshing: boolean;
  passwordRequired: boolean;
}

const STATUS_CACHE_KEY = 'status-data-v1';
const STATUS_CACHE_MAX_AGE_MS = 10 * 60 * 1000;

interface StoredStatusData {
  savedAt: number;
  data: StatusData;
}

function readStoredStatusData(): StatusData | undefined {
  try {
    const value = window.localStorage.getItem(STATUS_CACHE_KEY);
    if (!value) return undefined;
    const stored = JSON.parse(value) as StoredStatusData;
    if (!stored.data || Date.now() - stored.savedAt > STATUS_CACHE_MAX_AGE_MS) {
      window.localStorage.removeItem(STATUS_CACHE_KEY);
      return undefined;
    }
    return stored.data;
  } catch {
    return undefined;
  }
}

function storeStatusData(data: StatusData) {
  try {
    window.localStorage.setItem(STATUS_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}

async function parseResponse(response: Response): Promise<StatusApiResponse> {
  try {
    return (await response.json()) as StatusApiResponse;
  } catch {
    return { code: response.status, message: '服务状态接口返回了无效响应', source: 'api' };
  }
}

export function useStatusData() {
  const [state, setState] = useState<StatusDataState>(() => {
    const storedData = readStoredStatusData();
    return {
      ...(storedData ? { data: storedData } : {}),
      loading: !storedData,
      refreshing: Boolean(storedData),
      passwordRequired: false,
    };
  });
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    setState((current) => ({
      ...current,
      error: undefined,
      loading: current.data ? false : true,
      refreshing: Boolean(current.data),
    }));

    try {
      const response = await fetch('/api/status', {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      });
      const payload = await parseResponse(response);
      if (!response.ok || !payload.data) {
        if (response.status === 401 && payload.passwordRequired) {
          if (mountedRef.current) {
            setState({ loading: false, refreshing: false, passwordRequired: true });
          }
          return;
        }
        throw new Error(payload.message || '无法获取服务状态');
      }
      if (mountedRef.current) {
        storeStatusData(payload.data);
        setState({
          data: payload.data,
          loading: false,
          refreshing: false,
          passwordRequired: false,
        });
      }
    } catch (error) {
      if (mountedRef.current) {
        setState((current) => ({
          ...current,
          error: error instanceof Error ? error.message : '无法获取服务状态',
          loading: false,
          refreshing: false,
        }));
      }
    }
  }, []);

  const login = useCallback(async (password: string) => {
    const bytes = new TextEncoder().encode(password);
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    const passwordHash = [...new Uint8Array(hash)]
      .map((value) => value.toString(16).padStart(2, '0'))
      .join('');
    const response = await fetch('/api/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: passwordHash }),
    });
    const payload = (await response.json()) as { message?: string };
    if (!response.ok) throw new Error(payload.message || '登录失败');
    await load();
  }, [load]);

  useEffect(() => {
    mountedRef.current = true;
    void load();
    const timer = window.setInterval(
      () => void load(),
      siteConfig.status.refreshIntervalSeconds * 1000,
    );
    return () => {
      mountedRef.current = false;
      window.clearInterval(timer);
    };
  }, [load]);

  return { ...state, login, refresh: load };
}
