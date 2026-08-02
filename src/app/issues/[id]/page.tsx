import { db } from "@/db";
import { contentCards, polls, pollVotes, userOpinions, users } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import IssueClient, { type IssueCard, type IssuePoll } from "./IssueClient";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function IssuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();

  // Postgres raises on a malformed uuid — bounce to 404 instead of a 500.
  if (!UUID_RE.test(id)) notFound();

  const card = await db.select().from(contentCards).where(eq(contentCards.id, id));
  if (!card[0]) notFound();

  const linkedPolls = await db.select().from(polls).where(eq(polls.cardId, id));

  let userVotes: { pollId: string; optionIndex: number }[] = [];
  let userOpinion: string | null = null;
  let compassPosition = { x: 0, y: 0 };

  if (userId) {
    if (linkedPolls.length > 0) {
      userVotes = await db
        .select({ pollId: pollVotes.pollId, optionIndex: pollVotes.optionIndex })
        .from(pollVotes)
        .where(eq(pollVotes.userId, userId)) as { pollId: string; optionIndex: number }[];
    }

    const opinion = await db
      .select()
      .from(userOpinions)
      .where(and(eq(userOpinions.userId, userId), eq(userOpinions.cardId, id)))
      .limit(1);

    if (opinion[0]) userOpinion = opinion[0].opinion;

    const user = await db.select({ compassPosition: users.compassPosition }).from(users).where(eq(users.id, userId));
    if (user[0]?.compassPosition) compassPosition = user[0].compassPosition as { x: number; y: number };
  }

  const pollsWithVotes = await Promise.all(
    linkedPolls.map(async (poll) => {
      const votes = await db
        .select()
        .from(pollVotes)
        .where(eq(pollVotes.pollId, poll.id));
      return { ...poll, votes };
    })
  );

  return (
    <IssueClient
      card={card[0] as unknown as IssueCard}
      polls={pollsWithVotes as unknown as IssuePoll[]}
      userVotes={userVotes}
      userOpinion={userOpinion}
      userId={userId ?? null}
      compassPosition={compassPosition}
    />
  );
}


