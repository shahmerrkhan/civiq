import { NextResponse } from "next/server";
import { geminiGenerate } from "@/lib/gemini";
import { db } from "@/db";
import { contentCards } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const raw = await geminiGenerate({
      prompt: `Generate 1 current Ontario political news card for young Canadians (16-25). Cover a variety of these categories: Housing, Healthcare, Education, Environment, Economy, Infrastructure. Each must feel like a real, specific issue — not generic.

Return ONLY valid JSON, no markdown, no backticks:
{
  "cards": [
    {
      "title": "Short punchy headline, max 12 words",
      "summary": "2-3 sentence plain-English summary. What happened, why it matters to young Ontarians.",
      "source": "CBC | TVO | Toronto Star | Globe and Mail | Ontario Legislature",
      "category": "Housing | Healthcare | Education | Environment | Economy | Infrastructure",
      "stat": "One specific surprising stat or data point relevant to this issue. Under 20 words.",
      "perspectives": {
        "left": "2-3 sentences on the progressive/NDP/Green perspective.",
        "centre": "2-3 sentences on the centrist/Liberal perspective.",
        "right": "2-3 sentences on the conservative/PC perspective."
      },
      "deepdive": "4-5 sentences of deeper context — history, data, what's at stake long term."
    }
  ]
}

Make each card genuinely interesting. Vary the categories. No duplicates.`,
      maxTokens: 3000,
      grounding: true,
    });

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in response");

    let jsonStr = match[0];
    try {
      JSON.parse(jsonStr);
    } catch {
      let lastGood = jsonStr.lastIndexOf('"},');
      if (lastGood > 0) {
        jsonStr = jsonStr.substring(0, lastGood + 2) + "]}";
      } else {
        lastGood = jsonStr.lastIndexOf('"}');
        if (lastGood > 0) jsonStr = jsonStr.substring(0, lastGood + 2) + "]}";
        else throw new Error("JSON too malformed");
      }
    }

    const parsed = JSON.parse(jsonStr);
    const generated = parsed.cards as {
      title: string; summary: string; source: string; category: string;
      stat: string; perspectives: { left: string; centre: string; right: string }; deepdive: string;
    }[];

    const limited = generated.slice(0, 1);

    const countResult = await db.select({ count: sql<number>`count(*)` }).from(contentCards);
    const cardCount = Number(countResult[0].count);
    if (cardCount >= 30) {
      await db.delete(contentCards);
    }

    const inserted = await db.insert(contentCards).values(
      limited.map(c => ({
        title: c.title,
        summary: c.summary,
        sourceName: c.source,
        category: c.category,
        stat: c.stat,
        perspectives: c.perspectives,
        deepDive: c.deepdive,
        approved: true,
        publishedAt: new Date(),
      }))
    ).returning();

    return NextResponse.json({ success: true, added: inserted.length });
  } catch (err) {
    console.error("Feed cron error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
