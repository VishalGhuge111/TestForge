import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { expectedStatus, actualStatus, endpoint } = await request.json();
    if (
      typeof expectedStatus !== 'number' ||
      typeof actualStatus !== 'number' ||
      typeof endpoint !== 'string'
    ) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 503 });
    }

    const prompt = `Explain why this API test failed in 1-2 lines.\nExpected: ${expectedStatus}\nActual: ${actualStatus}\nEndpoint: ${endpoint}`;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 100,
      }),
    });

    if (!openaiRes.ok) {
      return NextResponse.json({ error: 'OpenAI API error' }, { status: 503 });
    }
    const data = await openaiRes.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json({ error: 'No explanation returned' }, { status: 500 });
    }
    return NextResponse.json({ explanation: content });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate explanation' }, { status: 500 });
  }
}
