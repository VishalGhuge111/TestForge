import type { HTTPRequest } from './types';

export function buildCurlCommand(request: HTTPRequest): string {
  const parts: string[] = ['curl'];

  // Add URL
  parts.push(`'${request.url}'`);

  // Add method if not GET
  if (request.method !== 'GET') {
    parts.push(`-X ${request.method}`);
  }

  // Add headers
  if (request.headers) {
    Object.entries(request.headers).forEach(([key, value]) => {
      parts.push(`-H '${key}: ${value}'`);
    });
  }

  // Add auth header if present
  if (request.auth?.type === 'bearer' && request.auth.credentials) {
    parts.push(`-H 'Authorization: Bearer ${request.auth.credentials}'`);
  } else if (request.auth?.type === 'basic' && request.auth.credentials) {
    parts.push(`-H 'Authorization: Basic ${request.auth.credentials}'`);
  }

  // Add body if present
  if (request.body) {
    const escapedBody = request.body.replace(/'/g, "'\\''");
    parts.push(`-d '${escapedBody}'`);
  }

  return parts.join(' \\\n  ');
}
