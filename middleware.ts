import { rewrite } from '@vercel/functions';

import { resolveStatusDomainEntry } from './server/routing/statusDomain';

export const config = {
  matcher: ['/', '/history'],
};

export default function middleware(request: Request) {
  const destination = resolveStatusDomainEntry(new URL(request.url));
  if (!destination) return undefined;

  return rewrite(new URL(destination, request.url));
}
