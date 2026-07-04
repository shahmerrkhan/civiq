import { db } from "@/db";
import { polls, pollVotes, contentCards, users } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, sql } from "drizzle-orm";
import PollsClient, { type Poll, type VoteCount } from "./PollsClient";

export default async function PollsPage() {
  const { userId } = await auth();

  const allPolls = await db
    .select({
      id: polls.id,
      question: polls.question,
      options: polls.options,
      expiresAt: polls.expiresAt,
      createdAt: polls.createdAt,
      cardId: polls.cardId,
      cardTitle: contentCards.title,
      cardCategory: contentCards.category,
    })
    .from(polls)
    .leftJoin(contentCards, eq(polls.cardId, contentCards.id))
    .orderBy(sql`${polls.createdAt} desc`);

  const voteCounts = await db
    .select({
      pollId: pollVotes.pollId,
      optionIndex: pollVotes.optionIndex,
      count: sql<number>`count(*)`,
      leaning: pollVotes.userLeaning,
    })
    .from(pollVotes)
    .groupBy(pollVotes.pollId, pollVotes.optionIndex, pollVotes.userLeaning);

  let userVotes: { pollId: string; optionIndex: number }[] = [];
  let compassPosition = { x: 0, y: 0 };

  if (userId) {
    userVotes = await db
      .select({ pollId: pollVotes.pollId, optionIndex: pollVotes.optionIndex })
      .from(pollVotes)
      .where(eq(pollVotes.userId, userId)) as { pollId: string; optionIndex: number }[];

    const user = await db.select({ compassPosition: users.compassPosition }).from(users).where(eq(users.id, userId));
    if (user[0]?.compassPosition) compassPosition = user[0].compassPosition as { x: number; y: number };
  }

  return (
    <PollsClient
      polls={allPolls as unknown as Poll[]}
      voteCounts={voteCounts as unknown as VoteCount[]}
      userVotes={userVotes}
      userId={userId ?? null}
      compassPosition={compassPosition}
    />
  );
}



