import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { db } from "@/db";
import { contentCards } from "@/db/schema";
import { eq, gte } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

function getTodayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const revalidate = 0;

export async function GET() {
  try {
    await auth();

    // Return today's already-saved cards if they exist
    const existing = await db
      .select()
      .from(contentCards)
      .where(gte(contentCards.publishedAt, getTodayStart()));

    if (existing.length >= 6) {
      const cards = existing.map((c, i) => ({
        id: i + 1,
        dbId: c.id,
        title: c.title,
        summary: c.summary,
        source: c.sourceName ?? "Civiq",
        category: c.category ?? "Ontario",
        time: timeAgo(c.publishedAt),
        perspectives: c.perspectives ?? { left: "", centre: "", right: "" },
        deepdive: c.deepDive ?? "",
      }));
      return NextResponse.json({ cards });
    }

    // Generate fresh cards with Groq
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 3500,
      messages: [
        {
          role: "user",
          content: `Generate 6 current Ontario political news cards for young Canadians (16-25). Each must be about a real, recent Ontario or Canadian political issue — housing, healthcare, education, transit, environment, or economy.

Return ONLY valid JSON, no markdown, no backticks:
{
  "cards": [
    {
      "title": "Short punchy headline, max 12 words",
      "summary": "2-3 sentence plain-English summary of the issue. What happened, why it matters to young Ontarians.",
      "source": "CBC / TVO / Toronto Star / Globe and Mail / Ontario Legislature",
      "category": "Housing | Healthcare | Education | Environment | Economy | Infrastructure",
      "perspectives": {
        "left": "2-3 sentences on the progressive/NDP/Green perspective on this issue.",
        "centre": "2-3 sentences on the centrist/Liberal perspective.",
        "right": "2-3 sentences on the conservative/PC perspective."
      },
      "deepdive": "4-5 sentences of deeper context — history, data, what's at stake long term."
    }
  ]
}

Make them genuinely interesting and relevant. No generic or vague topics.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in response");

    let jsonStr = match[0];
    // If Groq truncated mid-response, close the JSON safely
    try {
      JSON.parse(jsonStr);
    } catch {
      // Try to salvage partial JSON by closing open structures
      const lastGoodCard = jsonStr.lastIndexOf('"},');
      if (lastGoodCard > 0) {
        jsonStr = jsonStr.substring(0, lastGoodCard + 2) + "]}";
      } else {
        throw new Error("JSON too malformed to salvage");
      }
    }

    const parsed = JSON.parse(jsonStr);
    const generated = parsed.cards as {
      title: string;
      summary: string;
      source: string;
      category: string;
      perspectives: { left: string; centre: string; right: string };
      deepdive: string;
    }[];

    // Persist to DB so opinions/bookmarks have a stable reference
    const inserted = await db
      .insert(contentCards)
      .values(
        generated.map((c) => ({
          title: c.title,
          summary: c.summary,
          sourceName: c.source,
          category: c.category,
          perspectives: c.perspectives,
          deepDive: c.deepdive,
          approved: true,
          publishedAt: new Date(),
        }))
      )
      .returning();

    const cards = inserted.map((c, i) => ({
      id: i + 1,
      dbId: c.id,
      title: c.title,
      summary: c.summary,
      source: c.sourceName ?? "Civiq",
      category: c.category ?? "Ontario",
      time: "Just now",
      perspectives: c.perspectives ?? { left: "", centre: "", right: "" },
      deepdive: c.deepDive ?? "",
    }));

    return NextResponse.json({ cards });
  } catch (err) {
    console.error("Feed error:", err);
    // Fallback: return whatever cards exist in DB even if old
    try {
      const fallback = await db
        .select()
        .from(contentCards)
        .where(eq(contentCards.approved, true));

      if (fallback.length > 0) {
        const cards = fallback.slice(0, 6).map((c, i) => ({
          id: i + 1,
          dbId: c.id,
          title: c.title,
          summary: c.summary,
          source: c.sourceName ?? "Civiq",
          category: c.category ?? "Ontario",
          time: timeAgo(c.publishedAt),
          perspectives: c.perspectives ?? { left: "", centre: "", right: "" },
          deepdive: c.deepDive ?? "",
        }));
        return NextResponse.json({ cards });
      }
    } catch {}

    return NextResponse.json({ error: "Could not load feed" }, { status: 500 });
  }
}

function timeAgo(date: Date | null) {
  if (!date) return "Recently";
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}