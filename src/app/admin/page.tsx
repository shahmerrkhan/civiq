import { db } from "@/db";
export const dynamic = "force-dynamic";
import { contentCards, polls, witnessEvents, forecastQuestions, circlePostReports, circlePosts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import AdminClient, { type Card, type Poll, type WitnessEvent, type ForecastQuestion, type Report } from "./AdminClient";

export default async function AdminPage() {
  const cards = await db
    .select()
    .from(contentCards)
    .orderBy(desc(contentCards.createdAt));

  const allPolls = await db
    .select()
    .from(polls);

  const allWitnessEvents = await db
    .select()
    .from(witnessEvents)
    .orderBy(desc(witnessEvents.createdAt));

  const allForecastQuestions = await db
    .select()
    .from(forecastQuestions)
    .orderBy(desc(forecastQuestions.createdAt));

  const allReports = await db
    .select({
      id: circlePostReports.id,
      postId: circlePostReports.postId,
      reportedBy: circlePostReports.reportedBy,
      reason: circlePostReports.reason,
      createdAt: circlePostReports.createdAt,
      postContent: circlePosts.content,
      postUsername: circlePosts.username,
    })
    .from(circlePostReports)
    .leftJoin(circlePosts, eq(circlePostReports.postId, circlePosts.id))
    .orderBy(desc(circlePostReports.createdAt));

  return (
    <AdminClient
      cards={cards as unknown as Card[]}
      polls={allPolls as unknown as Poll[]}
      witnessEvents={allWitnessEvents as unknown as WitnessEvent[]}
      forecastQuestions={allForecastQuestions as unknown as ForecastQuestion[]}
      reports={allReports as unknown as Report[]}
    />
  );
}





