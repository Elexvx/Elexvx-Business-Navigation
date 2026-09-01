import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  authCookie,
  createAuthToken,
  isPasswordProtectionEnabled,
  matchesConfiguredPasswordHash,
} from '../server/status/auth.ts';
import { readJsonBody } from '../server/status/http.ts';

export default async function handler(
  request: IncomingMessage & { body?: unknown },
  response: ServerResponse,
) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'POST') {
    response.statusCode = 405;
    response.setHeader('Allow', 'POST');
    response.end(JSON.stringify({ code: 405, message: 'Method not allowed' }));
    return;
  }
  if (!isPasswordProtectionEnabled()) {
    response.statusCode = 200;
    response.end(JSON.stringify({ code: 200, message: '当前未启用密码保护' }));
    return;
  }

  try {
    const body = await readJsonBody<{ password?: string }>(request);
    if (!body.password || !matchesConfiguredPasswordHash(body.password)) {
      response.statusCode = 401;
      response.end(JSON.stringify({ code: 401, message: '密码错误' }));
      return;
    }
    response.setHeader('Set-Cookie', authCookie(await createAuthToken()));
    response.statusCode = 200;
    response.end(JSON.stringify({ code: 200, message: '登录成功' }));
  } catch {
    response.statusCode = 400;
    response.end(JSON.stringify({ code: 400, message: '请求格式错误' }));
  }
}
