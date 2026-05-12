// /api/ai/explain - Server-side error explanation via OpenAI
// Only called if OpenAI API key is available
// Returns graceful error if AI is unavailable

import { NextRequest, NextResponse } from 'next/server';
import { RequestError, ErrorCategory } from '@/lib/types';
import { AIExplanation, BeginnerExplanation } from '@/lib/ai-types';

interface ExplainRequest {
  status?: number;
  errorCategory?: ErrorCategory;
  errorMessage?: string;
  responseSnippet?: string;
  method?: string;
  isBeginnerMode?: boolean;
}

interface ExplainResponse {
  isAvailable: boolean;
  explanation?: AIExplanation | BeginnerExplanation;
  error?: string;
}

// Generate explanation prompt - keep it compact for cost efficiency
function buildExplainPrompt(
  status: number | undefined,
  errorCategory: ErrorCategory | undefined,
  errorMessage: string | undefined,
  responseSnippet: string | undefined,
  method: string | undefined,
  isBeginnerMode: boolean = false
): string {
  const snippetText = responseSnippet ? `\nResponse: ${responseSnippet.substring(0, 200)}` : '';
  
  const systemPrompt = isBeginnerMode
    ? 'Explain in simple terms a beginner learning APIs would understand.'
    : 'Provide a technical explanation for a developer.';
  
  return `${systemPrompt}

Error Details:
- HTTP Status: ${status || 'unknown'}
- Category: ${errorCategory || 'unknown'}
- Message: ${errorMessage || 'no message'}
- Method: ${method || 'unknown'}${snippetText}

Provide a JSON response with:
{
  "likelyCause": "brief explanation of why this happened",
  "debuggingSteps": ["step 1", "step 2", "step 3"],
  "relevantDocs": "relevant documentation link if applicable"
}`;
}

async function callOpenAI(prompt: string): Promise<{ likelyCause: string; debuggingSteps: string[]; relevantDocs?: string } | null> {
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
            content: 'You are a helpful API debugging assistant. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 300,
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

export async function POST(request: NextRequest): Promise<NextResponse<ExplainResponse>> {
  try {
    const body = (await request.json()) as ExplainRequest;
    
    // Check if OpenAI is available
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        isAvailable: false,
        error: 'AI features not configured. Set OPENAI_API_KEY environment variable.',
      });
    }
    
    // Build compact prompt
    const prompt = buildExplainPrompt(
      body.status,
      body.errorCategory,
      body.errorMessage,
      body.responseSnippet,
      body.method,
      body.isBeginnerMode
    );
    
    // Call OpenAI
    const aiResult = await callOpenAI(prompt);
    
    if (!aiResult) {
      return NextResponse.json({
        isAvailable: false,
        error: 'Failed to get explanation from AI service.',
      });
    }
    
    // Format response
    const explanation: AIExplanation | BeginnerExplanation = {
      likelyCause: aiResult.likelyCause,
      debuggingSteps: aiResult.debuggingSteps,
      relevantDocs: aiResult.relevantDocs,
    };
    
    // Add beginner-friendly wrapping if needed
    if (body.isBeginnerMode) {
      const beginnerExplanation: BeginnerExplanation = {
        simplifiedCause: explanation.likelyCause,
        whatToTry: explanation.debuggingSteps,
        learnMore: explanation.relevantDocs,
      };
      
      return NextResponse.json({
        isAvailable: true,
        explanation: beginnerExplanation,
      });
    }
    
    return NextResponse.json({
      isAvailable: true,
      explanation,
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
