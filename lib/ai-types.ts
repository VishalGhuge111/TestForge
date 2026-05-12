// AI-related types for intelligent debugging

import { HTTPResponse, HTTPRequest } from './types';

// Assertion suggestion from local heuristics or AI
export interface AssertionSuggestion {
  type: 'statusCode' | 'responseContainsKey' | 'responseContainsValue' | 'headerExists' | 'contentTypeIncludes' | 'responseTimeLessThan' | 'bodyIsEmpty';
  id?: string;
  name: string;
  expectedValue: string | number;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

// Anomaly detected in response
export interface ResponseAnomaly {
  type: 'unexpectedFormat' | 'stackTrace' | 'largePayload' | 'slowResponse' | 'errorStructure';
  id?: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  suggestion?: string;
}

// Security/risk warning
export interface SecurityWarning {
  type: 'exposedToken' | 'exposedApiKey' | 'suspiciousAuth' | 'largePayload' | 'productionCredentials';
  id?: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  location: 'headers' | 'body' | 'url';
}

// AI explanation response
export interface AIExplanation {
  likelyCause: string;
  debuggingSteps: string[];
  relevantDocs?: string;
}

// Beginner-friendly explanation
export interface BeginnerExplanation {
  simplifiedCause: string;
  whatToTry: string[];
  learnMore?: string;
}

// AI result (either explanation or suggestions, with fallback for when AI is unavailable)
export interface AIInsight {
  explanation?: AIExplanation | BeginnerExplanation;
  suggestions?: AssertionSuggestion[];
  isBeginnerMode?: boolean;
  isAvailable: boolean; // false if OpenAI failed or key missing
  error?: string;
}
