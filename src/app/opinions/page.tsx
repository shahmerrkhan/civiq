import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { userOpinions, contentCards } from "@/db/schema";
import { eq } from "drizzle-orm";
import OpinionsClient, { type Opinion } from "./OpinionsClient";

export default async function OpinionsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const opinions = await db
    .select({
      id: userOpinions.id,
      opinion: userOpinions.opinion,
      createdAt: userOpinions.createdAt,
      cardId: userOpinions.cardId,
      cardTitle: contentCards.title,
      cardCategory: contentCards.category,
      cardSummary: contentCards.summary,
    })
    .from(userOpinions)
    .leftJoin(contentCards, eq(userOpinions.cardId, contentCards.id))
    .where(eq(userOpinions.userId, userId))
    .orderBy(userOpinions.createdAt);

  return <OpinionsClient opinions={opinions as unknown as Opinion[]} />;
}


