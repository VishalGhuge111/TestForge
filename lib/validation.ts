import { z } from 'zod';

export const APISpecSchema = z.object({
  url: z.string().url('Invalid URL format'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']),
  headers: z.record(z.string()).optional(),
  body: z.string().optional(),
  description: z.string().optional(),
});

export const GenerationRequestSchema = z.object({
  apiSpec: APISpecSchema,
  focusAreas: z.array(z.string()).min(1, 'Select at least one focus area'),
  testCount: z.number().int().min(3).max(20),
});

export const TestCaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  endpoint: z.string(),
  method: z.string(),
  headers: z.record(z.string()).optional(),
  body: z.string().optional(),
  expectedStatusCode: z.number().optional(),
  expectedBodyPattern: z.string().optional(),
  timeout: z.number().optional(),
});

export const TestResultSchema = z.object({
  testCaseId: z.string(),
  testCaseName: z.string(),
  endpoint: z.string(),
  method: z.string(),
  status: z.enum(['passed', 'failed', 'error']),
  statusCode: z.number().optional(),
  responseTime: z.number(),
  actualResponse: z.string().optional(),
  error: z.string().optional(),
  timestamp: z.string(),
});

export type APISpec = z.infer<typeof APISpecSchema>;
export type GenerationRequest = z.infer<typeof GenerationRequestSchema>;
export type TestCase = z.infer<typeof TestCaseSchema>;
export type TestResult = z.infer<typeof TestResultSchema>;
