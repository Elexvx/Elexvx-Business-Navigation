import type { IncomingMessage, ServerResponse } from 'node:http';

import { clearedAuthCookie } from '../server/status/auth.ts';

export default function handler(request: IncomingMessage, response: ServerResponse) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.statusCode = 405;
    response.setHeader('Allow', 'POST');
    response.end(JSON.stringify({ code: 405, message: 'Method not allowed' }));
    return;
  }
  response.setHeader('Set-Cookie', clearedAuthCookie());
  response.statusCode = 200;
  response.end(JSON.stringify({ code: 200, message: '已退出登录' }));
}
