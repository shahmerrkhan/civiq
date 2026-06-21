import { NextResponse } from "next/server";
import { db } from "@/db";
import { contentCards } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { geminiGenerate } from "@/lib/gemini";

export const revalidate = 0;

const CARDS_PER_PAGE = 10;
const MIN_POOL = 20;
const MAX_POOL = 99999; // no hard cap, keep growing
let isGenerating = false; // in-memory lock to prevent simultaneous generation

async function generateAndSave(count: number) {
  const raw = await geminiGenerate({
    prompt: `Generate ${count} current Ontario political news cards for young Canadians (16-25). Cover a variety of these categories: Housing, Healthcare, Education, Environment, Economy, Infrastructure. Each must feel like a real, specific issue — not generic.

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
    maxTokens: 6000,
    grounding: true,
  });

  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in response");

  let jsonStr = match[0];
  try {
    JSON.parse(jsonStr);
  } catch {
    const lastGood = jsonStr.lastIndexOf('"},');
    if (lastGood > 0) jsonStr = jsonStr.substring(0, lastGood + 2) + "]}";
    else throw new Error("JSON too malformed");
  }

  const parsed = JSON.parse(jsonStr);
  const generated = parsed.cards as {
    title: string; summary: string; source: string; category: string;
    stat: string; perspectives: { left: string; centre: string; right: string }; deepdive: string;
  }[];

  const inserted = await db.insert(contentCards).values(
    generated.map(c => ({
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

  return inserted;
}

export async function GET(req: Request) {
try {
    await auth();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(20, parseInt(searchParams.get("limit") ?? String(CARDS_PER_PAGE)));
    const offset = (page - 1) * limit;

    // Count total approved cards
    const allCards = await db
      .select()
      .from(contentCards)
      .where(eq(contentCards.approved, true))
      .orderBy(desc(contentCards.publishedAt));

    // Only generate if pool is low, we're not already generating, and we haven't hit the max
    if (allCards.length < MIN_POOL && !isGenerating && allCards.length < MAX_POOL) {
      isGenerating = true;
      try {
        await generateAndSave(MIN_POOL - allCards.length);
        const refreshed = await db
          .select()
          .from(contentCards)
          .where(eq(contentCards.approved, true))
          .orderBy(desc(contentCards.publishedAt));
        const slice = refreshed.slice(offset, offset + limit);
        isGenerating = false;
        return NextResponse.json({ cards: formatCards(slice), total: refreshed.length, page, hasMore: offset + limit < refreshed.length });
      } catch (genErr) {
        console.error("Generation failed:", genErr);
        isGenerating = false;
      }
    }

    const slice = allCards.slice(offset, offset + limit);

    // Only top up in background if genuinely low and not already generating
    if (allCards.length < MIN_POOL + 10 && !isGenerating && allCards.length < MAX_POOL) {
      isGenerating = true;
      generateAndSave(10).catch((e) => { console.error(e); isGenerating = false; }).then(() => { isGenerating = false; });
    }

    return NextResponse.json({
      cards: formatCards(slice),
      total: allCards.length,
      page,
      hasMore: offset + limit < allCards.length,
    });

  } catch (err) {
    console.error("Feed error:", err);
    try {
      const fallback = await db
        .select()
        .from(contentCards)
        .where(eq(contentCards.approved, true))
        .orderBy(desc(contentCards.publishedAt));
      if (fallback.length > 0) {
        return NextResponse.json({ cards: formatCards(fallback.slice(0, 10)), total: fallback.length, page: 1, hasMore: false });
      }
    } catch {}
    return NextResponse.json({ error: "Could not load feed" }, { status: 500 });
  }
}

function formatCards(cards: typeof contentCards.$inferSelect[]) {
  return cards.map((c, i) => ({
    id: i + 1,
    dbId: c.id,
    title: c.title,
    summary: c.summary,
    source: c.sourceName ?? "Civiq",
    category: c.category ?? "Ontario",
    time: timeAgo(c.publishedAt),
    stat: c.stat ?? null,
    perspectives: (c.perspectives as { left: string; centre: string; right: string }) ?? { left: "", centre: "", right: "" },
    deepdive: c.deepDive ?? "",
  }));
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
