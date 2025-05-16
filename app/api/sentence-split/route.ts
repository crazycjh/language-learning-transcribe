import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text, sentencesPerSplit } = await request.json();
    if (!text || !sentencesPerSplit) {
      return NextResponse.json({ error: "Missing text or sentencesPerSplit" }, { status: 400 });
    }

    const sentences = text.split(/(?<=[.?!])\s+/);
    const splits = [];
    for (let i = 0; i < sentences.length; i += sentencesPerSplit) {
      splits.push(sentences.slice(i, i + sentencesPerSplit).join(' '));
    }

    return NextResponse.json({ splits });

  } catch (error) {
    console.error("Error splitting sentences:", error);
    return NextResponse.json({ error: "Failed to split sentences" }, { status: 500 });
  }
}
