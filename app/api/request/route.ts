import { NextRequest, NextResponse } from 'next/server';
import type { HTTPRequest, HTTPResponse, RequestError } from '@/lib/types';
import { categorizeError } from '@/lib/error-categorizer';

interface RequestPayload {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
  auth?: {
    type: 'none' | 'bearer' | 'basic';
    credentials?: string;
  };
  timeout?: number;
}

async function executeRequest(payload: RequestPayload): Promise<{
  response?: HTTPResponse;
  error?: RequestError;
}> {
  const startTime = Date.now();
  const timeout = payload.timeout || 15000; // Default 15 seconds
  
  try {
    // Validate URL
    try {
      new URL(payload.url);
    } catch {
      return {
        error: {
          category: 'network',
          message: 'URL is missing valid protocol or hostname',
          suggestedFix: 'Check that the URL starts with http:// or https://',
        },
      };
    }

    // Create AbortController for cancellation/timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Build headers
    const headers = new Headers(payload.headers || {});
    
    // Add auth header if provided
    if (payload.auth?.type === 'bearer' && payload.auth.credentials) {
      headers.set('Authorization', `Bearer ${payload.auth.credentials}`);
    } else if (payload.auth?.type === 'basic' && payload.auth.credentials) {
      headers.set('Authorization', `Basic ${payload.auth.credentials}`);
    }

    // Set content-type for POST/PUT/PATCH with body
    if (payload.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    // Execute the fetch
    const response = await fetch(payload.url, {
      method: payload.method || 'GET',
      headers,
      body: payload.body ? payload.body : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;

    // Read response body
    let body = '';
    try {
      body = await response.text();
    } catch {
      body = '[Failed to read response body]';
    }

    // Calculate response size
    const size = new Blob([body]).size;

    // Get content-type from response headers
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Convert headers to plain object
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const httpResponse: HTTPResponse = {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body,
      timestamp: new Date().toISOString(),
      duration,
      size,
      contentType,
    };

    if (!response.ok) {
      const category = response.status === 401 || response.status === 403
        ? 'auth'
        : response.status === 429
          ? 'rateLimit'
          : 'network';

      return {
        error: {
          category,
          message:
            response.status === 401 || response.status === 403
              ? `Authentication failed (${response.status})`
              : response.status === 429
                ? 'Rate limit exceeded'
                : `Request failed with status ${response.status}`,
          details: body ? body.slice(0, 500) : `${response.status} ${response.statusText}`,
          suggestedFix:
            response.status === 401 || response.status === 403
              ? 'Check for an invalid token, expired credentials, or missing auth header.'
              : response.status === 429
                ? 'Wait before retrying or inspect rate limit headers.'
                : 'Review the response body and endpoint behavior.',
        },
      };
    }

    return { response: httpResponse };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Handle different error types
    let errorObj: RequestError;

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorObj = {
          category: 'timeout',
          message: 'Request exceeded configured timeout',
          details: `Configured timeout: ${payload.timeout || 15000}ms. Actual duration: ${duration}ms.`,
          suggestedFix: 'Try increasing the timeout or checking if the endpoint is responding.',
        };
      } else {
        errorObj = categorizeError(error);
      }
    } else {
      errorObj = {
        category: 'unknown',
        message: 'An unexpected error occurred',
        suggestedFix: 'Check the endpoint and try again.',
      };
    }

    return { error: errorObj };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestPayload;

    // Validate required fields
    if (!body.url) {
      return NextResponse.json(
        { error: { category: 'network', message: 'URL is required' } },
        { status: 400 }
      );
    }

    const result = await executeRequest(body);

    if (result.error) {
      return NextResponse.json({
        state: 'error',
        error: result.error,
      });
    }

    if (result.response) {
      return NextResponse.json({
        state: 'success',
        response: result.response,
      });
    }

    return NextResponse.json(
      { error: { category: 'unknown', message: 'No response received' } },
      { status: 500 }
    );
  } catch (error) {
    console.error('[v0] Request route error:', error);

    return NextResponse.json(
      {
        state: 'error',
        error: {
          category: 'unknown',
          message: 'Failed to process request',
          suggestedFix: 'Check the server logs for more details.',
        },
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
