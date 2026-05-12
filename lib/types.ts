// HTTP Request/Response Types for Inspector

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type AuthType = 'none' | 'bearer' | 'basic';

export type ErrorCategory = 'timeout' | 'cors' | 'auth' | 'rateLimit' | 'network' | 'parse' | 'unknown';

export type ExecutionState = 'idle' | 'loading' | 'success' | 'error' | 'cancelled';

// Request Configuration (sent from client to /api/request)
export interface HTTPRequest {
  url: string;
  method: HTTPMethod;
  headers?: Record<string, string>;
  body?: string;
  auth?: {
    type: AuthType;
    credentials?: string; // Bearer token or base64(user:pass)
  };
  timeout?: number; // in milliseconds, default 15000
}

// Response received from /api/request
export interface HTTPResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  timestamp: string;
  duration: number; // in milliseconds
  size: number; // total response size in bytes
  contentType: string;
}

// Error response from /api/request
export interface RequestError {
  category: ErrorCategory;
  message: string;
  details?: string;
  suggestedFix?: string;
}

// Combined request execution result
export interface RequestExecutionResult {
  state: ExecutionState;
  response?: HTTPResponse;
  error?: RequestError;
  isCancelled?: boolean;
}

// Stored request history item
export interface HistoryItem {
  id: string;
  request: HTTPRequest;
  response?: HTTPResponse;
  error?: RequestError;
  timestamp: string;
  duration: number;
  state: ExecutionState;
}

// Local storage structure for request history
export interface StoredRequestHistory {
  items: HistoryItem[];
  lastUpdated: string;
}

// Test Assertions
export type AssertionType = 
  | 'statusCode' 
  | 'responseContainsKey' 
  | 'responseContainsValue' 
  | 'responseTimeLessThan' 
  | 'headerExists' 
  | 'contentTypeIncludes'
  | 'bodyIsEmpty';

export interface TestAssertion {
  id: string;
  type: AssertionType;
  name: string;
  expectedValue: string | number;
  description?: string;
}

export interface AssertionResult {
  assertion: TestAssertion;
  passed: boolean;
  expectedValue: string | number;
  actualValue: string | number | boolean | null;
  message: string;
  reason?: string;
}

export interface TestEnvironmentSnapshot {
  name: string;
  variables: Record<string, string>;
}

// Test Case (saved request + assertions)
export interface TestCase {
  id: string;
  name: string;
  description?: string;
  request: HTTPRequest;
  assertions: TestAssertion[];
  environment?: TestEnvironmentSnapshot;
  collectionId?: string;
  createdAt: string;
  updatedAt: string;
}

// Collection (group of test cases)
export interface TestCollection {
  id: string;
  name: string;
  description?: string;
  testCases: TestCase[];
  createdAt: string;
  updatedAt?: string;
}

// Environment Variables
export interface Environment {
  id: string;
  name: string;
  variables: Record<string, string>;
  isActive: boolean;
}

export interface EnvironmentResolution {
  value: string;
  warnings: string[];
}

export interface TestRunHistoryItem {
  id: string;
  testCaseId?: string;
  testName: string;
  requestUrl: string;
  timestamp: string;
  duration: number;
  passed: number;
  failed: number;
  total: number;
}
