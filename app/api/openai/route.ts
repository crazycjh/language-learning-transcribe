import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  const reqBody = await request.json();

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: reqBody.prompt }],
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API Error:", response.status, response.statusText);
      return NextResponse.json({ error: `OpenAI API Error: ${response.status} ${response.statusText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ data });

  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return NextResponse.json({ error: "Failed to call OpenAI API" }, { status: 500 });
  }
}
