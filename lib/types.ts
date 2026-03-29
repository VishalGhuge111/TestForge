// API Schema Types
export interface APISpec {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string>;
  body?: string;
  description?: string;
}

export interface TestCase {
  id: string;
  name: string;
  description?: string;
  endpoint: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
  expectedStatusCode?: number;
  expectedBodyPattern?: string;
  timeout?: number;
}

export interface TestResult {
  testCaseId: string;
  testCaseName: string;
  endpoint: string;
  method: string;
  status: 'passed' | 'failed' | 'error';
  statusCode?: number;
  responseTime: number;
  actualResponse?: string;
  error?: string;
  reason?: string; // Reason for failure (if any)
  timestamp: string;
}

export interface GenerationRequest {
  apiSpec: APISpec;
  focusAreas: string[];
  testCount: number;
}

export interface RateLimitInfo {
  remaining: number;
  resetTime: number;
  limit: number;
}
