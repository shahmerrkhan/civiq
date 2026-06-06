import { db } from "@/db";
export const dynamic = "force-dynamic";
import { contentCards, polls, witnessEvents, forecastQuestions } from "@/db/schema";
import { desc } from "drizzle-orm";
import AdminClient from "./AdminClient";

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

  return (
    <AdminClient
      cards={cards as any}
      polls={allPolls as any}
      witnessEvents={allWitnessEvents as any}
      forecastQuestions={allForecastQuestions as any}
    />
  );
}