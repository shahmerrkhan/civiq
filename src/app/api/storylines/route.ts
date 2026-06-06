import { NextResponse } from "next/server";
import { db } from "@/db";
import { storylines, storylineChapters, storylineFollows, storylineOpinions } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();

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

      return {
        ...s,
        chapters,
        chapterCount: chapters.length,
        latestChapter: chapters[0] ?? null,
        followers: Number(followCount[0]?.count ?? 0),
        isFollowing,
        myOpinion,
      };
    })
  );

  return NextResponse.json({ storylines: enriched });
}