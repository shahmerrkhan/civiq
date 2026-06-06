import { NextResponse } from "next/server";
import { db } from "@/db";
import { storylines, storylineChapters, storylineFollows, storylineOpinions } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cachedStorylines: { data: unknown; cachedAt: number } | null = null;

async function fetchAllStorylines() {
  const allStorylines = await db
    .select()
    .from(storylines)
    .orderBy(desc(storylines.updatedAt));

  const enriched = await Promise.all(
    allStorylines.map(async (s) => {
      const chapters = await db
        .select()
        .from(storylineChapters)
        .where(eq(storylineChapters.storylineId, s.id))
        .orderBy(desc(storylineChapters.publishedAt));

      const followCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(storylineFollows)
        .where(eq(storylineFollows.storylineId, s.id));

      return {
        ...s,
        chapters,
        chapterCount: chapters.length,
        latestChapter: chapters[0] ?? null,
        followers: Number(followCount[0]?.count ?? 0),
      };
    })
  );

  return enriched;
}

export async function GET() {
  const { userId } = await auth();

  const now = Date.now();

  // Refresh cache if stale or empty
  if (!cachedStorylines || now - cachedStorylines.cachedAt > CACHE_TTL_MS) {
    const fresh = await fetchAllStorylines();
    cachedStorylines = { data: fresh, cachedAt: now };
  }

  const baseStorylines = cachedStorylines.data as Awaited<ReturnType<typeof fetchAllStorylines>>;

  // Per-user data (following/opinions) still fetched fresh — can't cache these
  const enriched = await Promise.all(
    baseStorylines.map(async (s) => {
      let isFollowing = false;
      let myOpinion = null;

      if (userId) {
        const follow = await db
          .select()
          .from(storylineFollows)
          .where(and(eq(storylineFollows.userId, userId), eq(storylineFollows.storylineId, s.id)))
          .limit(1);
        isFollowing = follow.length > 0;

        const op = await db
          .select()
          .from(storylineOpinions)
          .where(and(eq(storylineOpinions.userId, userId), eq(storylineOpinions.storylineId, s.id)))
          .orderBy(desc(storylineOpinions.createdAt))
          .limit(1);
        myOpinion = op[0]?.opinion ?? null;
      }

      return { ...s, isFollowing, myOpinion };
    })
  );

  return NextResponse.json({ storylines: enriched });
}