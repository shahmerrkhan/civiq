import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/db";
import { geminiGenerate } from "@/lib/gemini";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const cached = await sql`
      SELECT content, created_at FROM pulse_cache
      WHERE created_at > NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (cached.length > 0) {
      return NextResponse.json({ pulse: cached[0].content, generatedAt: cached[0].created_at, cached: true });
    }

    const raw = await geminiGenerate({
      prompt: `You are Civiq, a non-partisan civic platform for Ontario Gen Z. Generate this week's Ontario Political Pulse.

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

Generate exactly 4 items. Be specific, current, and relevant to Gen Z in Ontario.`,
      maxTokens: 2000,
      grounding: true,
    });

    let pulse: unknown;
    try {
      const clean = raw.replace(/```json|```/g, "").trim();
      const match = clean.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON found in response");
      pulse = JSON.parse(match[0]);
    } catch (parseErr) {
      console.error("Pulse JSON parse error:", parseErr);
      return NextResponse.json({ error: "Failed to generate pulse" }, { status: 500 });
    }

    await sql`
      INSERT INTO pulse_cache (content) VALUES (${JSON.stringify(pulse)})
    `.catch(err => console.error("Pulse cache insert error:", err));

    return NextResponse.json({ pulse, generatedAt: new Date().toISOString(), cached: false });
  } catch (err) {
    console.error("Pulse GET error:", err);
    return NextResponse.json({ error: "Failed to load pulse" }, { status: 500 });
  }
} 