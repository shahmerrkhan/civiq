import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import {
  users, userActivity, userOpinions, pollVotes, userProgress,
  forecastPredictions, forecastQuestions, witnessWatches, witnessEvents,
  circleMembers, circles, storylineFollows, storylines, bookmarks,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Run all independent queries in parallel
  const [
    activityRows, opinions, votes, progress,
    savedBookmarks, joinedCircles, followed, watches,
  ] = await Promise.all([
    db.select().from(userActivity).where(eq(userActivity.userId, userId)),
    db.select().from(userOpinions).where(eq(userOpinions.userId, userId)).orderBy(desc(userOpinions.createdAt)).limit(5),
    db.select().from(pollVotes).where(eq(pollVotes.userId, userId)),
    db.select().from(userProgress).where(eq(userProgress.userId, userId)),
    db.select().from(bookmarks).where(eq(bookmarks.userId, userId)),
    db.select({ id: circleMembers.id, leaning: circleMembers.leaning, joinedAt: circleMembers.joinedAt, title: circles.title, emoji: circles.emoji, category: circles.category, slug: circles.slug })
      .from(circleMembers).innerJoin(circles, eq(circleMembers.circleId, circles.id)).where(eq(circleMembers.userId, userId)),
    db.select({ id: storylineFollows.id, title: storylines.title, status: storylines.status, category: storylines.category, slug: storylines.slug })
      .from(storylineFollows).innerJoin(storylines, eq(storylineFollows.storylineId, storylines.id)).where(eq(storylineFollows.userId, userId)).limit(5),
    db.select({ id: witnessWatches.id, watchedAt: witnessWatches.watchedAt, title: witnessEvents.title, status: witnessEvents.status, category: witnessEvents.category })
      .from(witnessWatches).innerJoin(witnessEvents, eq(witnessWatches.eventId, witnessEvents.id)).where(eq(witnessWatches.userId, userId)).orderBy(desc(witnessWatches.watchedAt)).limit(5),
  ]);


  // Forecast predictions
  const predictions = await db.select({
    id: forecastPredictions.id,
    prediction: forecastPredictions.prediction,
    confidence: forecastPredictions.confidence,
    pointsEarned: forecastPredictions.pointsEarned,
    createdAt: forecastPredictions.createdAt,
    question: forecastQuestions.question,
    status: forecastQuestions.status,
    outcome: forecastQuestions.outcome,
  })
    .from(forecastPredictions)
    .innerJoin(forecastQuestions, eq(forecastPredictions.questionId, forecastQuestions.id))
    .where(eq(forecastPredictions.userId, userId))
    .orderBy(desc(forecastPredictions.createdAt))
    .limit(10);

  const forecastCorrect = predictions.filter(p => p.status === "resolved" && p.outcome === p.prediction).length;
  const forecastTotal = predictions.filter(p => p.status === "resolved").length;


  // Top engaged category from activity meta
  const categoryCount: Record<string, number> = {};
  for (const row of activityRows) {
    const cat = (row.meta as any)?.category;
    if (cat) categoryCount[cat] = (categoryCount[cat] ?? 0) + 1;
  }
  const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return NextResponse.json({
    user: {
      username: user.username,
      compassPosition: user.compassPosition,
      streakCount: user.streakCount ?? 0,
      lastStreakDate: user.lastStreakDate,
      createdAt: user.createdAt,
    },
    xp,
    actionCounts,
    opinions,
    pollsVoted: votes.length,
    modulesCompleted,
    predictions,
    forecastCorrect,
    forecastTotal,
    watches,
    joinedCircles,
    followedStorylines: followed,
    bookmarksCount: savedBookmarks.length,
    topCategory,
  });
}