// /api/ai/suggest - Server-side assertion suggestion via OpenAI
// Only called if user explicitly requests advanced suggestions
// Returns graceful error if AI is unavailable

import { NextRequest, NextResponse } from 'next/server';
import { HTTPResponse } from '@/lib/types';
import { AssertionSuggestion } from '@/lib/ai-types';

interface SuggestRequest {
  response: HTTPResponse;
  existingSuggestions?: AssertionSuggestion[];
}

interface SuggestResponse {
  isAvailable: boolean;
  suggestions?: AssertionSuggestion[];
  error?: string;
}

// Generate assertion suggestion prompt - keep it compact
function buildSuggestPrompt(
  response: HTTPResponse,
  existingSuggestions: AssertionSuggestion[] = []
): string {
  const existingNames = existingSuggestions.map(s => s.name).join(', ');
  
  return `You are an API testing expert. Given a JSON response, suggest 2-3 additional assertions to add to the test suite.

Response Status: ${response.status}
Response Size: ${response.size} bytes
Duration: ${response.duration}ms
Content-Type: ${response.contentType}

Response Body (first 500 chars):
${response.body.substring(0, 500)}

Existing suggestions: ${existingNames || 'none'}

Suggest assertions in JSON format:
{
  "suggestions": [
    {
      "type": "responseContainsKey" | "responseContainsValue" | "headerExists" | "contentTypeIncludes",
      "name": "human readable assertion name",
      "expectedValue": "string or number",
      "confidence": "high" | "medium" | "low",
      "reason": "why this assertion is valuable"
    }
  ]
}

Return ONLY valid JSON, no other text.`;
}

async function callOpenAI(prompt: string): Promise<{ suggestions: AssertionSuggestion[] } | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful API testing assistant. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 400,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return null;
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    
    // Parse JSON response from OpenAI
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('OpenAI call failed:', error);
    return null;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<SuggestResponse>> {
  try {
    const body = (await request.json()) as SuggestRequest;
    
    // Check if OpenAI is available
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        isAvailable: false,
        error: 'AI features not configured. Set OPENAI_API_KEY environment variable.',
      });
    }
    
    // Validate response object
    if (!body.response) {
      return NextResponse.json(
        {
          isAvailable: false,
          error: 'Response data required',
        },
        { status: 400 }
      );
    }
    
    // Build compact prompt
    const prompt = buildSuggestPrompt(body.response, body.existingSuggestions || []);
    
    // Call OpenAI
    const aiResult = await callOpenAI(prompt);
    
    if (!aiResult || !aiResult.suggestions) {
      return NextResponse.json({
        isAvailable: false,
        error: 'Failed to generate suggestions from AI service.',
      });
    }
    
    // Validate and filter suggestions
    const validSuggestions = (aiResult.suggestions || [])
      .filter(s => s.type && s.name && s.expectedValue !== undefined && s.confidence)
      .slice(0, 3); // Limit to 3 additional suggestions
    
    return NextResponse.json({
      isAvailable: true,
      suggestions: validSuggestions,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        isAvailable: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
