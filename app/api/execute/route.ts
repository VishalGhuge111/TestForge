import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { TestCase, TestResult } from '@/lib/types';

interface ExecuteRequest {
  testCases: TestCase[];
}

async function executeTestCase(testCase: TestCase): Promise<TestResult> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(testCase.endpoint, {
      method: testCase.method,
      headers: testCase.headers || {
        'Content-Type': 'application/json',
      },
      body: testCase.body,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    const responseText = await response.text();


    let status: 'passed' | 'failed' = 'passed';
    let reason = '';

    // ✅ 1. Status code validation
    if (
      typeof testCase.expectedStatusCode === 'number' &&
      response.status !== testCase.expectedStatusCode
    ) {
      status = 'failed';
      reason = `Expected ${testCase.expectedStatusCode}, got ${response.status}`;
    }

    // ✅ 2. Basic response validation (SMART, not strict)
    if (status === 'passed') {
      // Example: if expecting success, ensure response is not empty
      if (response.status === 200 && responseText.length === 0) {
        status = 'failed';
        reason = 'Empty response received';
      }

      // Example: JSON validity check
      try {
        JSON.parse(responseText);
      } catch {
        status = 'failed';
        reason = 'Response is not valid JSON';
      }
    }

    return {
      testCaseId: testCase.id,
      testCaseName: testCase.name,
      endpoint: testCase.endpoint,
      method: testCase.method,
      status: status === "passed" ? "passed" : "failed",
      statusCode: response.status,
      responseTime,
      actualResponse: responseText.substring(0, 500),
      reason,
      timestamp: new Date().toISOString(),
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;

    return {
      testCaseId: testCase.id,
      testCaseName: testCase.name,
      endpoint: testCase.endpoint,
      method: testCase.method,
      status: 'error',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit();
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before trying again.' },
        { status: 429 }
      );
    }

    const body: ExecuteRequest = await request.json();

    if (!Array.isArray(body.testCases) || body.testCases.length === 0) {
      return NextResponse.json(
        { error: 'No test cases provided' },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      body.testCases.map((testCase) => executeTestCase(testCase))
    );

    const summary = {
      total: results.length,
      passed: results.filter((r) => r.status === 'passed').length,
      failed: results.filter((r) => r.status === 'failed').length,
      errors: results.filter((r) => r.status === 'error').length,
      averageResponseTime:
        results.reduce((sum, r) => sum + r.responseTime, 0) / results.length,
    };

    return NextResponse.json({
      success: true,
      results,
      summary,
    });

  } catch (error) {
    console.error('Execution error:', error);

    return NextResponse.json(
      { error: 'Failed to execute test cases' },
      { status: 500 }
    );
  }
}