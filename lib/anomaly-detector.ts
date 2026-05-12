// Local heuristic anomaly detection
// No AI needed - pure logic-based analysis

import { HTTPResponse } from './types';
import { ResponseAnomaly } from './ai-types';
import { nanoid } from 'nanoid';

// Detect if response is HTML instead of JSON
function isHTMLResponse(response: HTTPResponse): boolean {
  const contentType = response.contentType.toLowerCase();
  if (contentType.includes('html')) return true;
  
  const body = response.body.toLowerCase().trim();
  if (body.startsWith('<!doctype') || body.startsWith('<html')) return true;
  
  return false;
}

// Detect stack traces in response
function hasStackTrace(response: HTTPResponse): boolean {
  const body = response.body;
  
  // Common stack trace patterns
  const patterns = [
    /at [a-zA-Z0-9_$.<>]+\s*\(/m,
    /File\s*"[^"]+",\s*line\s*\d+/,
    /^\s*at\s+/m,
    /Exception in thread/,
    /Traceback \(most recent call last\)/,
  ];
  
  return patterns.some(pattern => pattern.test(body));
}

// Detect unusually large response
function isLargePayload(response: HTTPResponse, threshold = 1048576): boolean {
  // Default threshold: 1MB
  return response.size > threshold;
}

// Detect unusually slow response
function isSlowResponse(duration: number, threshold = 5000): boolean {
  // Default threshold: 5 seconds
  return duration > threshold;
}

// Detect error-like response structure (even if status is 200)
function hasErrorStructure(body: string): boolean {
  try {
    const parsed = JSON.parse(body);
    
    // Check for common error indicators in otherwise successful responses
    const errorIndicators = [
      parsed.error !== undefined,
      parsed.errors !== undefined,
      parsed.exception !== undefined,
      parsed.failure !== undefined,
      parsed.message?.toLowerCase().includes('error'),
      parsed.message?.toLowerCase().includes('failed'),
    ];
    
    return errorIndicators.some(x => x);
  } catch {
    return false;
  }
}

// Main anomaly detection function
export function detectAnomalies(response: HTTPResponse): ResponseAnomaly[] {
  const anomalies: ResponseAnomaly[] = [];
  
  // Check for unexpected format (HTML when JSON expected)
  if (isHTMLResponse(response)) {
    anomalies.push({
      id: nanoid(),
      type: 'unexpectedFormat',
      severity: 'warning',
      message: 'Response is HTML, but API typically returns JSON. This might be an error page.',
      suggestion: 'Check the request URL and HTTP method. Server may have redirected or returned an error page.',
    });
  }
  
  // Check for stack traces
  if (hasStackTrace(response)) {
    anomalies.push({
      id: nanoid(),
      type: 'stackTrace',
      severity: 'critical',
      message: 'Response contains a stack trace, indicating a server-side error.',
      suggestion: 'Review the stack trace to identify the error. Check server logs for more details.',
    });
  }
  
  // Check for large payload
  if (isLargePayload(response)) {
    anomalies.push({
      id: nanoid(),
      type: 'largePayload',
      severity: 'info',
      message: `Response is large (${(response.size / 1024 / 1024).toFixed(2)}MB). This may impact performance.`,
      suggestion: 'Consider using pagination, filtering, or requesting only needed fields.',
    });
  }
  
  // Check for slow response
  if (isSlowResponse(response.duration)) {
    anomalies.push({
      id: nanoid(),
      type: 'slowResponse',
      severity: 'warning',
      message: `Response took ${response.duration}ms, which is slower than typical.`,
      suggestion: 'Check network conditions, server load, or optimize your query.',
    });
  }
  
  // Check for error structure in successful response
  if (response.status >= 200 && response.status < 300 && hasErrorStructure(response.body)) {
    anomalies.push({
      id: nanoid(),
      type: 'errorStructure',
      severity: 'warning',
      message: 'Response has status 200 but contains error indicators in the body.',
      suggestion: 'Check the response body for details. The API may be using custom error codes.',
    });
  }
  
  return anomalies;
}
