import { createHash, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { SignJWT, jwtVerify } from 'jose';

const cookieName = 'authToken';

function getSecret(): Uint8Array {
  const value = process.env.SITE_SECRET_KEY || process.env.SITE_SECRE_KEY || 'site-status';
  return new TextEncoder().encode(value);
}

export function isPasswordProtectionEnabled(): boolean {
  return Boolean(process.env.SITE_PASSWORD);
}

function readCookie(request: IncomingMessage, name: string): string | undefined {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;
  const prefix = `${name}=`;
  return cookieHeader
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(prefix))
    ?.slice(prefix.length);
}

export async function isAuthenticated(request: IncomingMessage): Promise<boolean> {
  if (!isPasswordProtectionEnabled()) return true;
  const token = readCookie(request, cookieName);
  if (!token) return false;
  try {
    await jwtVerify(token, getSecret(), { algorithms: ['HS256'] });
    return true;
  } catch {
    return false;
  }
}

export async function createAuthToken(): Promise<string> {
  return new SignJWT({ scope: 'status:read' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret());
}

export function matchesConfiguredPasswordHash(candidate: string): boolean {
  const configuredPassword = process.env.SITE_PASSWORD;
  if (!configuredPassword || !/^[a-f\d]{64}$/i.test(candidate)) return false;
  const expected = createHash('sha256').update(configuredPassword).digest('hex');
  return timingSafeEqual(Buffer.from(candidate.toLowerCase()), Buffer.from(expected));
}

export function authCookie(token: string): string {
  return `${cookieName}=${token}; Path=/; Max-Age=${30 * 24 * 60 * 60}; HttpOnly; Secure; SameSite=Strict`;
}

export function clearedAuthCookie(): string {
  return `${cookieName}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}
