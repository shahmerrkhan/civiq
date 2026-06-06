import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ChallengesClient from "./ChallengesClient";

export default async function ChallengesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <ChallengesClient />;
}