import { NextRequest, NextResponse } from 'next/server';
import { GenerationRequestSchema } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rate-limit';
import { TestCase } from '@/lib/types';

async function generateWithOpenAI(
  url: string,
  method: string,
  focusAreas: string[],
  testCount: number
): Promise<TestCase[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

const prompt = `
You are a senior QA engineer specializing in API testing.

Generate ${testCount} high-quality, realistic API test cases for:

URL: ${url}
Method: ${method}
Focus Areas: ${focusAreas.join(', ')}

Strict Rules:
- Do NOT assume authentication unless explicitly required
- Infer expected behavior based on typical REST API patterns
- Avoid generic test cases like "valid request"
- Include edge cases, malformed inputs, and boundary conditions
- Ensure each test case is unique and meaningful

Each test case must be in this JSON format:
{
  "name": "short descriptive title",
  "description": "clear explanation of what is being tested",
  "endpoint": "${url}",
  "method": "${method}",
  "headers": {},
  "body": null,
  "expectedStatusCode": number,
  "expectedBehavior": "detailed expected outcome"
}

Return ONLY a valid JSON array.
Do not include explanations outside JSON.
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
        model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  // Extract JSON from the response
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to parse OpenAI response');
  }

  const testCases = JSON.parse(jsonMatch[0]);

  return testCases.map((test: any, index: number) => ({
    id: `test-${Date.now()}-${index}`,
    name: test.name,
    description: test.description,
    endpoint: test.endpoint,
    method: test.method,
    headers: test.headers,
    body: test.body,
    expectedStatusCode: test.expectedStatusCode,
expectedBodyPattern: test.expectedBehavior || "",
    timeout: 5000,
  }));
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

    const body = await request.json();
    const payload = GenerationRequestSchema.parse(body);

    const testCases = await generateWithOpenAI(
      payload.apiSpec.url,
      payload.apiSpec.method,
      payload.focusAreas,
      payload.testCount
    );

    return NextResponse.json({
      success: true,
      testCases,
      count: testCases.length,
    });
  } catch (error) {
    console.error('Generation error:', error);

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: `Invalid request: ${error.message}` },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('OpenAI')) {
      return NextResponse.json(
      // Only log meaningful errors in production
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate test cases' },
      { status: 500 }
    );
  }
}
