import type { Plugin } from 'vite';

import { createDemoStatusData } from './demoData.ts';
import type { StatusApiResponse } from './types.ts';
import { fetchStatusData } from './uptimeRobot.ts';

export function statusDevApiPlugin(): Plugin {
  return {
    name: 'elexvx-status-dev-api',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
        if (pathname !== '/api/status') {
          next();
          return;
        }

        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.setHeader('Cache-Control', 'no-store');
        if (request.method !== 'GET') {
          response.statusCode = 405;
          response.end(JSON.stringify({ code: 405, message: 'Method not allowed', source: 'demo' }));
          return;
        }

        try {
          const apiKey = process.env.UPTIMEROBOT_API_KEY || process.env.API_KEY;
          const result = apiKey
            ? await fetchStatusData({
                apiKey,
                apiUrl: process.env.UPTIMEROBOT_API_URL || process.env.API_URL,
                historyDays: Number(process.env.COUNT_DAYS || 60),
              })
            : { data: createDemoStatusData(60), source: 'demo' as const };
          const payload: StatusApiResponse = {
            code: 200,
            message: 'success',
            source: result.source,
            data: result.data,
          };
          response.statusCode = 200;
          response.end(JSON.stringify(payload));
        } catch (error) {
          response.statusCode = 502;
          response.end(JSON.stringify({
            code: 502,
            message: error instanceof Error ? error.message : '监控服务请求失败',
            source: 'api',
          }));
        }
      });
    },
  };
}
