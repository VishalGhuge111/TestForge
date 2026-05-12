// Local heuristic security/risk warning detection
// No AI needed - pattern-based detection

import { HTTPRequest } from './types';
import { SecurityWarning } from './ai-types';
import { nanoid } from 'nanoid';

// Common patterns for tokens and keys
const TOKEN_PATTERNS = {
  bearerToken: /bearer\s+[a-zA-Z0-9\-_\.]+/i,
  apiKey: /[a-zA-Z0-9_-]{32,}/,
  jwtToken: /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/,
  awsKey: /AKIA[0-9A-Z]{16}/,
  privateKey: /-----BEGIN (RSA|DSA|EC|PGP|OPENSSH) PRIVATE KEY/,
  googleApiKey: /AIza[0-9A-Za-z\-_]{35}/,
};

// Production credential patterns
const PRODUCTION_PATTERNS = {
  productionUrl: /(prod|production|live|api\.company\.com)/i,
  productionPassword: /production_password|prod_pass|live_secret/i,
};

// Suspicious payload patterns
const SUSPICIOUS_PATTERNS = {
  largePayload: (size: number) => size > 10 * 1024 * 1024, // 10MB
  sqlInjection: /(\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b).*(-{2}|\/\*)/i,
  xssPayload: /(<script|javascript:|onerror=|onload=)/i,
};

function checkHeadersForSecrets(headers?: Record<string, string>): SecurityWarning[] {
  const warnings: SecurityWarning[] = [];
  
  if (!headers) return warnings;
  
  for (const [key, value] of Object.entries(headers)) {
    if (!value) continue;
    
    const lowerKey = key.toLowerCase();
    const lowerValue = value.toLowerCase();
    
    // Check authorization headers
    if (lowerKey === 'authorization') {
      if (lowerValue.includes('bearer ')) {
        warnings.push({
          id: nanoid(),
          type: 'exposedToken',
          severity: 'critical',
          message: 'Bearer token visible in Authorization header. Ensure this token is not sensitive or widely shared.',
          location: 'headers',
        });
      }
      if (lowerValue.includes('basic ')) {
        warnings.push({
          id: nanoid(),
          type: 'exposedToken',
          severity: 'critical',
          message: 'Basic auth credentials visible in Authorization header. This exposes username/password.',
          location: 'headers',
        });
      }
    }
    
    // Check for API key patterns in header values
    if (lowerKey.includes('apikey') || lowerKey.includes('api-key') || lowerKey.includes('x-api-key')) {
      if (TOKEN_PATTERNS.apiKey.test(value)) {
        warnings.push({
          id: nanoid(),
          type: 'exposedApiKey',
          severity: 'critical',
          message: `API key visible in "${key}" header. This could compromise your account.`,
          location: 'headers',
        });
      }
    }
    
    // Check for JWT tokens
    if (TOKEN_PATTERNS.jwtToken.test(value)) {
      warnings.push({
        id: nanoid(),
        type: 'exposedToken',
        severity: 'critical',
        message: `JWT token visible in "${key}" header. If this is sensitive, rotate it.`,
        location: 'headers',
      });
    }
    
    // Check for AWS keys
    if (TOKEN_PATTERNS.awsKey.test(value)) {
      warnings.push({
        id: nanoid(),
        type: 'exposedApiKey',
        severity: 'critical',
        message: `AWS access key visible in "${key}" header. This is a critical security risk.`,
        location: 'headers',
      });
    }
    
    // Check for private keys
    if (TOKEN_PATTERNS.privateKey.test(value)) {
      warnings.push({
        id: nanoid(),
        type: 'exposedApiKey',
        severity: 'critical',
        message: `Private key visible in "${key}" header. This is a critical security risk.`,
        location: 'headers',
      });
    }
  }
  
  return warnings;
}

function checkBodyForSecrets(body?: string): SecurityWarning[] {
  const warnings: SecurityWarning[] = [];
  
  if (!body) return warnings;
  
  try {
    const parsed = JSON.parse(body);
    const checkValue = (key: string, value: string | unknown) => {
      if (typeof value !== 'string') return;
      
      const lowerKey = key.toLowerCase();
      
      // Check for password/token/key fields
      if (lowerKey.includes('password') || lowerKey.includes('secret') || lowerKey.includes('token') || lowerKey.includes('apikey')) {
        if (TOKEN_PATTERNS.apiKey.test(value)) {
          warnings.push({
            id: nanoid(),
            type: 'exposedApiKey',
            severity: 'warning',
            message: `Sensitive value visible in request body field "${key}". Consider using environment variables.`,
            location: 'body',
          });
        }
        if (TOKEN_PATTERNS.jwtToken.test(value)) {
          warnings.push({
            id: nanoid(),
            type: 'exposedToken',
            severity: 'warning',
            message: `Token visible in request body field "${key}". Consider using environment variables.`,
            location: 'body',
          });
        }
      }
    };
    
    // Recursively check parsed body
    const checkObject = (obj: unknown) => {
      if (typeof obj !== 'object' || obj === null) return;
      for (const [key, value] of Object.entries(obj)) {
        checkValue(key, value);
        if (typeof value === 'object') checkObject(value);
      }
    };
    
    checkObject(parsed);
  } catch {
    // Not JSON, skip secret detection
  }
  
  return warnings;
}

function checkPayloadSuspicion(body?: string): SecurityWarning[] {
  const warnings: SecurityWarning[] = [];
  
  if (!body) return warnings;
  
  // SQL injection patterns
    if (SUSPICIOUS_PATTERNS.sqlInjection.test(body)) {
    warnings.push({
      id: nanoid(),
      type: 'suspiciousAuth',
      severity: 'warning',
      message: 'Payload contains SQL-like syntax. Ensure this is intentional.',
      location: 'body',
    });
  }
  
  // XSS patterns
  if (SUSPICIOUS_PATTERNS.xssPayload.test(body)) {
    warnings.push({
      id: nanoid(),
      type: 'suspiciousAuth',
      severity: 'warning',
      message: 'Payload contains script-like syntax. Ensure this is intentional.',
      location: 'body',
    });
  }
  
  return warnings;
}

function checkUrlForSecrets(url: string): SecurityWarning[] {
  const warnings: SecurityWarning[] = [];
  
  // Check for credentials in URL
  if (url.includes('@') && !url.includes('://@')) {
    // user:pass@host pattern
    warnings.push({
      id: nanoid(),
      type: 'exposedToken',
      severity: 'critical',
      message: 'Credentials visible in URL. Consider using Authorization header instead.',
      location: 'url',
    });
  }
  
  // Check for API key in query parameters
  if (url.includes('apikey=') || url.includes('api_key=') || url.includes('key=')) {
    warnings.push({
      id: nanoid(),
      type: 'exposedApiKey',
      severity: 'warning',
      message: 'API key visible in URL query parameters. Consider using Authorization header instead.',
      location: 'url',
    });
  }
  
  return warnings;
}

// Main security warning detection function
export function detectSecurityWarnings(request: HTTPRequest): SecurityWarning[] {
  const warnings: SecurityWarning[] = [];
  
  // Check headers
  warnings.push(...checkHeadersForSecrets(request.headers));
  
  // Check URL
  warnings.push(...checkUrlForSecrets(request.url));
  
  // Check body
  warnings.push(...checkBodyForSecrets(request.body));
  warnings.push(...checkPayloadSuspicion(request.body));
  
  // Remove duplicates
  const seen = new Set<string>();
  return warnings.filter(w => {
    const key = `${w.type}:${w.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
