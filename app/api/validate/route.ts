import { NextRequest, NextResponse } from 'next/server';
import { APISpecSchema } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit();
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before trying again.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const spec = APISpecSchema.parse(body);

    // Validate the API spec by making a HEAD or GET request
    try {
      const response = await fetch(spec.url, {
        method: spec.method,
        headers: spec.headers || {},
        body: spec.body ? spec.body : undefined,
        timeout: 5000,
      });

      return NextResponse.json({
        valid: true,
        statusCode: response.status,
        isReachable: response.ok,
        contentType: response.headers.get('content-type'),
      });
    } catch (fetchError) {
      return NextResponse.json({
        valid: false,
        error: `Failed to reach API: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
        isReachable: false,
      });
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: `Invalid API specification: ${error.message}` },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
