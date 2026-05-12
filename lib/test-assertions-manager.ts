import type { AssertionResult, HTTPResponse, TestAssertion } from './types';

export class TestAssertionsManager {
  static evaluateAssertion(assertion: TestAssertion, response: HTTPResponse): AssertionResult {
    const expectedValue = assertion.expectedValue;
    let passed = false;
    let actualValue: string | number | boolean | null = null;
    let message = '';

    try {
      switch (assertion.type) {
        case 'statusCode': {
          actualValue = response.status;
          passed = response.status === Number(expectedValue);
          message = passed
            ? `Status code matched ${expectedValue}`
            : `Expected status ${expectedValue}, got ${response.status}`;
          break;
        }

        case 'responseContainsKey': {
          actualValue = this.responseContainsKey(response.body, String(expectedValue));
          passed = Boolean(actualValue);
          message = passed
            ? `Response contains key "${expectedValue}"`
            : `Response did not contain key "${expectedValue}"`;
          break;
        }

        case 'responseContainsValue': {
          actualValue = this.responseContainsValue(response.body, String(expectedValue));
          passed = Boolean(actualValue);
          message = passed
            ? `Response contains value "${expectedValue}"`
            : `Response did not contain value "${expectedValue}"`;
          break;
        }

        case 'responseTimeLessThan': {
          actualValue = response.duration;
          const maxTime = Number(expectedValue);
          passed = response.duration <= maxTime;
          message = passed
            ? `Response time ${response.duration}ms was within ${maxTime}ms`
            : `Response time exceeded ${maxTime}ms (${response.duration}ms)`;
          break;
        }

        case 'headerExists': {
          const headerName = String(expectedValue).toLowerCase();
          const headerKey = Object.keys(response.headers).find((header) => header.toLowerCase() === headerName);
          actualValue = Boolean(headerKey);
          passed = Boolean(headerKey);
          message = passed
            ? `Header "${expectedValue}" exists`
            : `Header "${expectedValue}" was not found`;
          break;
        }

        case 'contentTypeIncludes': {
          actualValue = response.contentType;
          passed = response.contentType.toLowerCase().includes(String(expectedValue).toLowerCase());
          message = passed
            ? `Content-Type includes "${expectedValue}"`
            : `Expected Content-Type to include "${expectedValue}", got "${response.contentType}"`;
          break;
        }

        default: {
          message = 'Unknown assertion type';
          passed = false;
          actualValue = null;
        }
      }
    } catch (error) {
      passed = false;
      message = `Error evaluating assertion: ${String(error)}`;
      actualValue = null;
    }

    return {
      assertion,
      passed,
      expectedValue,
      actualValue,
      message,
      reason: message,
    };
  }

  static evaluateAssertions(assertions: TestAssertion[], response: HTTPResponse): AssertionResult[] {
    return assertions.map((assertion) => this.evaluateAssertion(assertion, response));
  }

  static getSummary(results: AssertionResult[]) {
    const passed = results.filter((result) => result.passed).length;
    const total = results.length;

    return {
      passed,
      failed: total - passed,
      total,
      percentage: total > 0 ? Math.round((passed / total) * 100) : 0,
    };
  }

  private static responseContainsKey(body: string, key: string): boolean {
    if (!body) return false;

    try {
      const parsed = JSON.parse(body) as unknown;
      return this.findJsonKey(parsed, key);
    } catch {
      return body.includes(key);
    }
  }

  private static responseContainsValue(body: string, value: string): boolean {
    if (!body) return false;

    try {
      const parsed = JSON.parse(body) as unknown;
      return this.findJsonValue(parsed, value);
    } catch {
      return body.includes(value);
    }
  }

  private static findJsonKey(value: unknown, targetKey: string): boolean {
    if (value === null || value === undefined || typeof value !== 'object') return false;

    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      if (key === targetKey) return true;
      if (this.findJsonKey(nestedValue, targetKey)) return true;
    }

    return false;
  }

  private static findJsonValue(value: unknown, targetValue: string): boolean {
    if (value === null || value === undefined) return false;

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value) === targetValue || String(value).includes(targetValue);
    }

    if (Array.isArray(value)) {
      return value.some((item) => this.findJsonValue(item, targetValue));
    }

    if (typeof value === 'object') {
      return Object.values(value as Record<string, unknown>).some((nestedValue) =>
        this.findJsonValue(nestedValue, targetValue)
      );
    }

    return false;
  }
}
