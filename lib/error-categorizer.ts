import type { ErrorCategory, HTTPRequest } from './types';

interface CategorizedError {
  category: ErrorCategory;
  message: string;
  suggestedFix: string;
}

interface DetailedErrorDiagnosis {
  summary: string;
  issues: string[];
  suggestions: string[];
}

export function diagnoseRequestError(
  error: unknown,
  request?: HTTPRequest,
  statusCode?: number
): DetailedErrorDiagnosis {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const issues: string[] = [];
  const suggestions: string[] = [];

  // CRITICAL CHECK 1: Unresolved environment variables
  if (request?.url && request.url.includes('{{') && request.url.includes('}}')) {
    const unresolved = request.url.match(/{{([^}]+)}}/g) || [];
    if (unresolved.length > 0) {
      const varName = unresolved[0]?.slice(2, -2) || 'unknown';
      issues.push(`Environment variable '${varName}' is undefined`);
      suggestions.push(
        `Define '${varName}' in your active environment before sending this request.`,
        `Missing variables: ${unresolved.map((v) => v.slice(2, -2)).join(', ')}`
      );
      return { summary: `Missing environment variable '${varName}'`, issues, suggestions };
    }
  }

  // Check for INVALID URL FORMAT
  if (request?.url) {
    // Check protocol
    if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) {
      issues.push('Invalid URL format: missing protocol');
      suggestions.push('URL must start with http:// or https://');
    }
    // Check for spaces
    if (request.url.includes(' ')) {
      issues.push('Invalid URL format: contains unencoded spaces');
      suggestions.push('Encode spaces as %20 or use valid characters only');
    }
    // Check URL validity
    try {
      const url = new URL(request.url);
      if (!url.hostname) {
        issues.push('Invalid URL format: missing hostname');
        suggestions.push('URL must include a valid domain (e.g., https://api.example.com)');
      }
    } catch {
      issues.push('Invalid URL format: malformed syntax');
      suggestions.push('Check URL syntax is valid (absolute URL required)');
    }
  }

  // Check for header issues
  if (request?.headers && Object.keys(request.headers).length === 0) {
    suggestions.push('Consider adding common headers like Content-Type and Authorization');
  }

  // Check for AUTH FAILURE (401/403)
  const hasAuth = request?.auth?.credentials ? true : false;
  const hasAuthHeader = request?.headers?.['Authorization'];
  if (statusCode === 401 || statusCode === 403) {
    if (!hasAuth && !hasAuthHeader) {
      issues.push(`Received ${statusCode} ${statusCode === 401 ? 'Unauthorized' : 'Forbidden'}: missing authentication`);
      suggestions.push(
        'Add authentication in Request Builder (Auth section)',
        'Verify Bearer token or Basic auth credentials are correct',
        'Check if API key is required as a header'
      );
    } else {
      issues.push(`Received ${statusCode} ${statusCode === 401 ? 'Unauthorized' : 'Forbidden'}: invalid credentials`);
      suggestions.push(
        'Verify credentials are correct and not expired',
        'Check token scope or permissions',
        'Ensure auth header format is correct (e.g., Bearer <token>)'
      );
    }
    return { summary: `${statusCode} ${statusCode === 401 ? 'Unauthorized' : 'Forbidden'}`, issues, suggestions };
  }

  // Check for TIMEOUT
  if (
    errorMessage.includes('timeout') ||
    errorMessage.includes('AbortError') ||
    errorMessage.includes('timed out')
  ) {
    const configuredTimeout = request?.timeout || 15000;
    issues.push(`Request exceeded configured timeout of ${configuredTimeout}ms`);
    suggestions.push(
      `Increase timeout in request settings (current: ${configuredTimeout}ms)`,
      'Verify the server is responding normally'
    );
    return { summary: 'Request timeout', issues, suggestions };
  }

  // Check for DNS / HOSTNAME FAILURE
  if (
    errorMessage.includes('ENOTFOUND') ||
    errorMessage.includes('getaddrinfo') ||
    errorMessage.includes('DNS') ||
    errorMessage.includes('Resolution failed')
  ) {
    const hostname = request?.url ? new URL(request.url).hostname : 'host';
    issues.push(`Domain could not be resolved: ${hostname}`);
    suggestions.push(
      `Verify '${hostname}' is a valid and accessible domain`,
      'Check your internet connection',
      'Try pinging the domain in a terminal'
    );
    return { summary: `DNS failure for ${hostname}`, issues, suggestions };
  }

  // Check for CONNECTION REFUSED
  if (
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('Connection refused') ||
    errorMessage.includes('ERR_CONNECTION_REFUSED')
  ) {
    const url = request?.url ? new URL(request.url) : null;
    const port = url?.port || (url?.protocol === 'https:' ? 443 : 80);
    issues.push(`Connection refused on ${url?.hostname}:${port}`);
    suggestions.push(
      'Verify the server is running and accessible',
      `Check that port ${port} is open and listening`,
      'Try the URL in your browser to debug'
    );
    return { summary: 'Connection refused', issues, suggestions };
  }

  // Check for CORS issues
  if (
    errorMessage.includes('CORS') ||
    errorMessage.includes('cross-origin') ||
    statusCode === 0
  ) {
    issues.push('CORS policy blocked request');
    suggestions.push(
      'This API does not allow requests from browsers (CORS policy)',
      'Try using a server-side proxy or backend request',
      'Contact API maintainer to enable CORS'
    );
    return { summary: 'CORS policy violation', issues, suggestions };
  }

  // Check for RESPONSE TYPE MISMATCH (JSON parse error)
  if (errorMessage.includes('JSON') && errorMessage.includes('parse')) {
    issues.push('Response content-type differs from expected JSON');
    suggestions.push(
      'Response is not valid JSON - check if the endpoint returns HTML or other format',
      'Verify Content-Type header matches response body',
      'Check server status page or API documentation'
    );
    return { summary: 'Response type mismatch', issues, suggestions };
  }

  // Check for invalid JSON request body
  if (
    request?.body &&
    errorMessage.includes('JSON') &&
    request.headers?.['Content-Type']?.includes('json')
  ) {
    issues.push('Invalid JSON in request body');
    suggestions.push(
      'Validate request body JSON syntax (try pasting in browser console)',
      'Check for unescaped quotes or missing commas'
    );
  }

  // Default summary if no specific issues
  let summary = 'Request failed';
  if (statusCode === 401 || statusCode === 403) {
    summary = 'Authentication failed';
  } else if (statusCode === 404) {
    summary = 'Endpoint not found';
  } else if (statusCode === 500 || statusCode === 502 || statusCode === 503) {
    summary = 'Server error';
  } else if (statusCode === 400) {
    summary = 'Invalid request';
  } else if (statusCode === 429) {
    summary = 'Rate limited';
  } else if (issues.length > 0) {
    summary = issues[0];
  }

  return {
    summary,
    issues,
    suggestions:
      suggestions.length > 0
        ? suggestions
        : [
            'Check the error details above',
            'Verify the URL and request configuration',
            'Try the request in a different tool like cURL or Postman',
          ],
  };
}

export function categorizeError(error: unknown, statusCode?: number): CategorizedError {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
    return {
      category: 'timeout',
      message: 'Request timed out. The server took too long to respond.',
      suggestedFix: 'Try increasing the timeout or checking if the endpoint is responding.',
    };
  }

  // CORS errors
  if (errorMessage.includes('CORS') || errorMessage.includes('cross-origin')) {
    return {
      category: 'cors',
      message: 'CORS error. This endpoint does not accept requests from browsers.',
      suggestedFix: 'Check if the API supports CORS or use the server-side proxy.',
    };
  }

  // Authentication errors
  if (statusCode === 401 || statusCode === 403) {
    return {
      category: 'auth',
      message: `Authentication failed (${statusCode}). Check your credentials.`,
      suggestedFix: 'Verify your auth token or API key in the Authorization header.',
    };
  }

  // Rate limit errors
  if (statusCode === 429) {
    return {
      category: 'rateLimit',
      message: 'Rate limit exceeded. Too many requests to this endpoint.',
      suggestedFix: 'Wait before retrying. Check rate limit headers for reset time.',
    };
  }

  // Network errors
  if (
    errorMessage.includes('fetch') ||
    errorMessage.includes('Network') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('ENOTFOUND')
  ) {
    return {
      category: 'network',
      message:
        errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')
          ? 'Hostname could not be resolved'
          : 'Network error. Could not reach the endpoint.',
      suggestedFix:
        errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')
          ? 'Check the hostname and DNS settings, then try again.'
          : 'Check the URL and ensure the endpoint is accessible and running.',
    };
  }

  // JSON parse errors
  if (errorMessage.includes('JSON') || errorMessage.includes('parse')) {
    return {
      category: 'parse',
      message: 'Response parsing failed. The response is not valid JSON.',
      suggestedFix: 'Check the Content-Type header and the response body format.',
    };
  }

  // Unknown error
  return {
    category: 'unknown',
    message: `Error: ${errorMessage}`,
    suggestedFix: 'Check the response details above for more information.',
  };
}
