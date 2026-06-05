import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { sql } from "@/db";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export async function GET() {
  try {
    const cached = await sql`
      SELECT content, created_at FROM pulse_cache
      WHERE created_at > NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (cached.length > 0) {
      return NextResponse.json({ pulse: cached[0].content, generatedAt: cached[0].created_at, cached: true });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: `You are Civiq, a non-partisan civic platform for Ontario Gen Z. Generate this week's Ontario Political Pulse.

Return ONLY a valid JSON object, no markdown, no backticks.

{
  "week": "e.g. June 2–8, 2025",
  "headline": "one punchy sentence summarizing Ontario politics this week",
  "items": [
    {
      "title": "short title",
      "summary": "2-3 sentences of what happened and why it matters to young Ontarians",
      "category": "Infrastructure" | "Economy" | "Education" | "Housing" | "Healthcare" | "Environment",
      "heat": "rising" | "cooling" | "exploding"
    }
  ],
  "watchThis": "one thing to watch next week and why",
  "didYouKnow": "one interesting Ontario political fact most people don't know"
}

Generate exactly 4 items. Be specific, current, and relevant to Gen Z in Ontario.`
      }],
    });

    const raw = completion.choices[0]?.message?.content || "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const pulse = JSON.parse(clean);

    await sql`
      INSERT INTO pulse_cache (content) VALUES (${JSON.stringify(pulse)})
    `;

    return NextResponse.json({ pulse, generatedAt: new Date().toISOString(), cached: false });
  } catch (err) {
    console.error("pulse error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
