import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, userOpinions, pollVotes, userProgress } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import ProfileClient from "./ProfileClient";

export default async function Profile() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const dbUser = await db.select().from(users).where(eq(users.id, userId));
  if (!dbUser[0] || !dbUser[0].onboardingComplete) redirect("/onboarding");

  const votesCount = await db
    .select({ count: count() })
    .from(pollVotes)
    .where(eq(pollVotes.userId, userId));

  const progressCount = await db
    .select({ count: count() })
    .from(userProgress)
    .where(eq(userProgress.userId, userId));

  const opinions = await db
    .select()
    .from(userOpinions)
    .where(eq(userOpinions.userId, userId))
    .orderBy(userOpinions.createdAt);

return (
    <ProfileClient
      name={user?.firstName || "Anonymous"}
      email={user?.emailAddresses[0]?.emailAddress || ""}
      imageUrl={user?.imageUrl || ""}
      compassPosition={(dbUser[0].compassPosition as { x: number; y: number }) || null}
      streakCount={dbUser[0].streakCount ?? 0}
      civicScore={0}
      opinions={opinions as any[]}
      pollsVoted={votesCount[0]?.count ?? 0}
      modulesCompleted={progressCount[0]?.count ?? 0}
    />
  );
}