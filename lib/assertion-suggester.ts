// Smart assertion suggestion generation
// Uses local heuristics first, optional OpenAI for advanced reasoning

import { HTTPResponse, HTTPRequest } from './types';
import { AssertionSuggestion } from './ai-types';
import { nanoid } from 'nanoid';

// Parse JSON response body safely
function parseResponseBody(response: HTTPResponse): unknown {
  if (response.contentType.includes('application/json')) {
    try {
      return JSON.parse(response.body);
    } catch {
      return null;
    }
  }
  return null;
}

// Get common keys from response object
function extractResponseKeys(parsed: unknown): string[] {
  if (typeof parsed !== 'object' || parsed === null) return [];
  
  const keys: string[] = [];
  const extract = (obj: unknown, maxDepth = 2, depth = 0) => {
    if (depth > maxDepth || !obj || typeof obj !== 'object') return;
    
    const entries = Array.isArray(obj) ? [obj[0]] : Object.entries(obj);
    for (const [key, value] of (Array.isArray(entries) ? [['', entries[0]]] : entries)) {
      if (typeof key === 'string' && !keys.includes(key) && keys.length < 5) {
        keys.push(key);
      }
      if (typeof value === 'object' && value !== null && depth < maxDepth) {
        extract(value, maxDepth, depth + 1);
      }
    }
  };
  
  extract(parsed);
  return keys;
}

// Generate local heuristic suggestions with contextual awareness
export function generateLocalSuggestions(
  response: HTTPResponse,
  request: HTTPRequest,
  duration: number
): AssertionSuggestion[] {
  const suggestions: AssertionSuggestion[] = [];
  
  // Analyze request context for smart suggestions
  const isGET = request.method === 'GET';
  const isPOST = request.method === 'POST';
  const isDELETE = request.method === 'DELETE';
  const isPUT = request.method === 'PUT';
  const statusStr = response.status.toString();
  const status2xx = statusStr.startsWith('2');
  const status201 = response.status === 201;
  const status204 = response.status === 204;
  const status400 = response.status === 400;
  const status404 = response.status === 404;
  const status5xx = statusStr.startsWith('5');
  const isJson = response.contentType.includes('json');
  const hasAuthHeader = request?.headers?.['Authorization'];
  
  // 1. Status code assertion - vary confidence by method and status
  const statusConfidence = (status2xx || status5xx) ? 'high' : 'medium';
  suggestions.push({
    id: nanoid(),
    type: 'statusCode',
    name: `Status should equal ${response.status}`,
    expectedValue: response.status,
    confidence: statusConfidence,
    reason: `Validate the expected HTTP ${response.status} response status for ${request.method}`,
  });
  
  // 2. Content-Type assertion (high confidence for JSON APIs)
  if (isJson) {
    suggestions.push({
      id: nanoid(),
      type: 'contentTypeIncludes',
      name: 'Response should be JSON',
      expectedValue: 'application/json',
      confidence: 'high',
      reason: 'Verify the response is in JSON format',
    });
  }
  
  // 3. Method-specific suggestions
  if (isPOST && status201) {
    // POST with 201 Created - check for location header
    if (response.headers['location']) {
      suggestions.push({
        id: nanoid(),
        type: 'headerExists',
        name: 'Response should have Location header',
        expectedValue: 'Location',
        confidence: 'high',
        reason: 'Verify resource location is returned on successful creation',
      });
    }
    // Check for ID in response body
    const parsed = parseResponseBody(response);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      if ('id' in (parsed as Record<string, unknown>)) {
        suggestions.push({
          id: nanoid(),
          type: 'responseContainsKey',
          name: 'Response should contain "id"',
          expectedValue: 'id',
          confidence: 'high',
          reason: 'Verify created resource ID is in response body',
        });
      }
    }
  }
  
  if (isDELETE) {
    // DELETE - expect 204 No Content or 200 OK
    // For successful DELETE, body should be empty or minimal
    if (status204) {
      suggestions.push({
        id: nanoid(),
        type: 'bodyIsEmpty',
        name: 'Response body should be empty (204 No Content)',
        expectedValue: '',
        confidence: 'high',
        reason: 'Verify DELETE returns no content as expected',
      });
    } else if (response.status === 200) {
      // Some APIs return 200 with empty or minimal body
      if (!response.body || response.body.trim() === '{}' || response.body.trim() === '') {
        suggestions.push({
          id: nanoid(),
          type: 'bodyIsEmpty',
          name: 'Response body should be empty',
          expectedValue: '',
          confidence: 'medium',
          reason: 'Verify successful deletion returns no content',
        });
      }
    }
  }
  
  if (isGET && status2xx && isJson) {
    // GET success - check for expected data structure
    const parsed = parseResponseBody(response);
    if (parsed && typeof parsed === 'object') {
      const keys = Object.keys(parsed as Record<string, unknown>);
      const importantKeys = ['id', 'data', 'results', 'items', 'records'];
      for (const key of importantKeys) {
        if (keys.includes(key)) {
          suggestions.push({
            id: nanoid(),
            type: 'responseContainsKey',
            name: `Response should contain "${key}"`,
            expectedValue: key,
            confidence: 'high',
            reason: `Verify expected field "${key}" in response`,
          });
          break;
        }
      }
    }
  }
  
  // 4. Response time assertion (smart threshold)
  if (duration < 5000) {
    const threshold = Math.ceil(duration * 1.5);
    suggestions.push({
      id: nanoid(),
      type: 'responseTimeLessThan',
      name: `Response time should be below ${threshold}ms`,
      expectedValue: threshold,
      confidence: duration > 2000 ? 'medium' : 'high',
      reason: `Ensure acceptable performance (currently ${duration}ms)`,
    });
  }
  
  // 5. Error response suggestions - context-aware (do NOT show JSON assertions on failure)
  if (status400 || status404 || status5xx) {
    // For error responses, focus on error validation, not on success patterns
    if (isJson) {
      const parsed = parseResponseBody(response);
      if (parsed && typeof parsed === 'object') {
        const errorKeys = ['error', 'message', 'errorMessage', 'detail', 'code'];
        for (const key of errorKeys) {
          if (key in (parsed as Record<string, unknown>)) {
            suggestions.push({
              id: nanoid(),
              type: 'responseContainsKey',
              name: `Error response should contain "${key}"`,
              expectedValue: key,
              confidence: 'high',
              reason: 'Verify error details are clearly reported',
            });
            break;
          }
        }
      }
    }
  }

  // 6. Auth-specific suggestions (if auth header present)
  if ((request.auth?.type === 'bearer' || hasAuthHeader) && status2xx) {
    suggestions.push({
      id: nanoid(),
      type: 'headerExists',
      name: 'Auth header should be present in request',
      expectedValue: 'Authorization',
      confidence: 'high',
      reason: 'Verify authentication is required and working',
    });
  }
  
  return suggestions.slice(0, 6); // Limit to 6 suggestions
}

// For potential OpenAI-based advanced suggestions
export async function generateAdvancedSuggestions(
  response: HTTPResponse,
  request: HTTPRequest
): Promise<AssertionSuggestion[] | null> {
  // This would call OpenAI via server endpoint
  // For now, returns null to indicate AI should be called
  // Implementation in /api/ai/suggest route
  return null;
}

// Combine local suggestions with optional AI suggestions
export function buildAssertionSuggestions(
  response: HTTPResponse,
  request: HTTPRequest,
  duration: number,
  includeAISuggestions = false
): AssertionSuggestion[] {
  const localSuggestions = generateLocalSuggestions(response, request, duration);
  
  // If AI suggestions requested, they would be fetched separately
  // For now, just return local suggestions
  return localSuggestions;
}
