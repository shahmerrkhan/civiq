import { NextResponse } from "next/server";
import { db } from "@/db";
import { storylines, storylineChapters, storylineFollows, storylineOpinions } from "@/db/schema";
import { eq, desc, sql, and, inArray } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const CACHE_KEY = "civiq:storylines:base";
const CACHE_TTL = 300; // 5 minutes in seconds

async function fetchAllStorylines() {
  const allStorylines = await db
    .select()
    .from(storylines)
    .orderBy(desc(storylines.updatedAt));

  if (allStorylines.length === 0) return [];

  const storylineIds = allStorylines.map(s => s.id);

  // Fetch all chapters and follow counts in 2 queries instead of 2N
  const [allChapters, allFollowCounts] = await Promise.all([
    db.select()
      .from(storylineChapters)
      .where(inArray(storylineChapters.storylineId, storylineIds))
      .orderBy(desc(storylineChapters.publishedAt)),
    db.select({
        storylineId: storylineFollows.storylineId,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(storylineFollows)
      .where(inArray(storylineFollows.storylineId, storylineIds))
      .groupBy(storylineFollows.storylineId),
  ]);

  const chaptersByStoryline: Record<string, typeof allChapters> = {};
  for (const c of allChapters) {
    if (!c.storylineId) continue;
    if (!chaptersByStoryline[c.storylineId]) chaptersByStoryline[c.storylineId] = [];
    chaptersByStoryline[c.storylineId].push(c);
  }
  const followCountMap: Record<string, number> = {};
  for (const f of allFollowCounts) {
    if (f.storylineId) followCountMap[f.storylineId] = f.count;
  }

  return allStorylines.map(s => {
    const chapters = chaptersByStoryline[s.id] ?? [];
    return {
      ...s,
      chapters,
      chapterCount: chapters.length,
      latestChapter: chapters[0] ?? null,
      followers: followCountMap[s.id] ?? 0,
    };
  });
}

export async function GET() {
  try {
    const { userId } = await auth();

    // Try Redis cache first
    let baseStorylines: Awaited<ReturnType<typeof fetchAllStorylines>>;
    const cached = await redis.get<string>(CACHE_KEY).catch(() => null);

    if (cached) {
      baseStorylines = JSON.parse(cached as string);
    } else {
      baseStorylines = await fetchAllStorylines();
      await redis.set(CACHE_KEY, JSON.stringify(baseStorylines), { ex: CACHE_TTL }).catch(() => {});
    }

    if (!userId) {
      return NextResponse.json({
        storylines: baseStorylines.map(s => ({ ...s, isFollowing: false, myOpinion: null })),
      });
    }

    // Fetch all user-specific data in 2 queries instead of 2N
    const storylineIds = baseStorylines.map(s => s.id);
    const [myFollows, myOpinions] = await Promise.all([
      storylineIds.length > 0
        ? db.select({ storylineId: storylineFollows.storylineId })
            .from(storylineFollows)
            .where(and(eq(storylineFollows.userId, userId), inArray(storylineFollows.storylineId, storylineIds)))
        : Promise.resolve([]),
      storylineIds.length > 0
        ? db.select({ storylineId: storylineOpinions.storylineId, opinion: storylineOpinions.opinion })
            .from(storylineOpinions)
            .where(and(eq(storylineOpinions.userId, userId), inArray(storylineOpinions.storylineId, storylineIds)))
            .orderBy(desc(storylineOpinions.createdAt))
        : Promise.resolve([]),
    ]);

    const followSet = new Set(myFollows.map(f => f.storylineId));
    const opinionMap: Record<string, string> = {};
    for (const o of myOpinions) {
      if (o.storylineId && !opinionMap[o.storylineId]) opinionMap[o.storylineId] = o.opinion;
    }

    return NextResponse.json({
      storylines: baseStorylines.map(s => ({
        ...s,
        isFollowing: followSet.has(s.id),
        myOpinion: opinionMap[s.id] ?? null,
      })),
    });
  } catch (err) {
    console.error("Storylines GET error:", err);
    return NextResponse.json({ error: "Failed to load storylines" }, { status: 500 });
  }
}