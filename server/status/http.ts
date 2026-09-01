import type { IncomingMessage } from 'node:http';

export async function readJsonBody<T>(request: IncomingMessage & { body?: unknown }): Promise<T> {
  if (request.body && typeof request.body === 'object') return request.body as T;
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const value = Buffer.concat(chunks).toString('utf8');
  return JSON.parse(value || '{}') as T;
}
