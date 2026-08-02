import { NextResponse } from "next/server";
import { db } from "@/db";
import { contentCards } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { geminiGenerate } from "@/lib/gemini";
import { Redis } from "@upstash/redis";

export const revalidate = 0;

const CARDS_PER_PAGE = 10;
const MIN_POOL = 20;

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Generation is paid Gemini usage triggered by an unauthenticated GET, so it
// is bounded three ways: a cooldown between runs, a hard daily cap, and the
// pool check in GET() which now counts pending cards too.
const GENERATION_COOLDOWN_SECONDS = 30 * 60; // at most one run per 30 min
const MAX_GENERATIONS_PER_DAY = 12;

async function generateAndSave(count: number) {
  // Day-bucketed spend cap. Checked before the cooldown so a stuck cooldown
  // key can never be worked around.
  const dayKey = `civiq:feed:gencount:${new Date().toISOString().slice(0, 10)}`;
  const used = Number((await redis.get<number>(dayKey).catch(() => 0)) ?? 0);
  if (used >= MAX_GENERATIONS_PER_DAY) return;

  // NOT released on success: the key doubles as the cooldown window, so a
  // completed run cannot immediately re-trigger on the very next request.
  const locked = await redis.set("civiq:feed:generating", "1", {
    nx: true,
    ex: GENERATION_COOLDOWN_SECONDS,
  });
  if (!locked) return;

  await redis.incr(dayKey).catch(() => {});
  await redis.expire(dayKey, 86400).catch(() => {});

  try {
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

    await db.insert(contentCards).values(
      generated.map(c => ({
        title: c.title,
        summary: c.summary,
        sourceName: c.source,
        category: c.category,
        stat: c.stat,
        perspectives: c.perspectives,
        deepDive: c.deepdive,
        approved: false,
        publishedAt: new Date(),
      }))
    );
  } catch (err) {
    // Only clear the lock on failure, so a crashed run doesn't block
    // generation for the whole cooldown window.
    await redis.del("civiq:feed:generating").catch(() => {});
    throw err;
  }
}

export async function GET(req: Request) {
  try {
    // Feed is public — no auth required
    
    const { searchParams } = new URL(req.url);
    // parseInt returns NaN for junk input, which propagates into .limit()/.offset().
    const rawPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
    const rawLimit = Number.parseInt(searchParams.get("limit") ?? String(CARDS_PER_PAGE), 10);
    const page = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1;
    const limit = Number.isFinite(rawLimit)
      ? Math.min(20, Math.max(1, rawLimit))
      : CARDS_PER_PAGE;
    const offset = (page - 1) * limit;

    const [{ total }] = await db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(contentCards)
      .where(eq(contentCards.approved, true));

    // Generation writes approved:false rows, so deciding whether to generate
    // from the approved count alone meant the trigger could never be satisfied
    // and every request re-ran a paid grounded generation. Count the pending
    // backlog too — cards already waiting on review are supply, not demand.
    const [{ pool }] = await db
      .select({ pool: sql<number>`cast(count(*) as int)` })
      .from(contentCards);

    if (pool < MIN_POOL) {
      await generateAndSave(MIN_POOL - pool);
    } else if (pool < MIN_POOL + 10) {
      generateAndSave(10).catch(console.error);
    }

    const slice = await db
      .select()
      .from(contentCards)
      .where(eq(contentCards.approved, true))
      .orderBy(desc(contentCards.publishedAt))
      .limit(limit)
      .offset(offset);

    const finalTotal = total < MIN_POOL ? MIN_POOL : total;

    return NextResponse.json({
      cards: formatCards(slice),
      total: finalTotal,
      page,
      hasMore: offset + limit < finalTotal,
    });

  } catch (err) {
    console.error("Feed error:", err);
    try {
      const fallback = await db
        .select()
        .from(contentCards)
        .where(eq(contentCards.approved, true))
        .orderBy(desc(contentCards.publishedAt))
        .limit(10);
      if (fallback.length > 0) {
        return NextResponse.json({ cards: formatCards(fallback), total: fallback.length, page: 1, hasMore: false });
      }
    } catch {}
    return NextResponse.json({ error: "Could not load feed" }, { status: 500 });
  }
}

function formatCards(cards: typeof contentCards.$inferSelect[]) {
  return cards.map((c) => ({
    id: c.id,
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