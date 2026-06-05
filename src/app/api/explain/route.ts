import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export async function POST(req: Request) {
  const { title, summary } = await req.json();
  if (!title || !summary) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: `Explain this political news to a 16-year-old who knows nothing about politics. Plain casual language, no jargon, max 4 sentences. Be direct about why it matters to a young person in Ontario.

Story: "${title}"
Context: "${summary}"

Plain English explanation:`
      }],
    });

    const explanation = completion.choices[0]?.message?.content?.trim() || "";
    return NextResponse.json({ explanation });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
