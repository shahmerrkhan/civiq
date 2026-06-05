import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { sql } from "@/db";
import DebateClient from "./DebateClient";

export default async function DebatePage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const userResult = await sql`SELECT compass_position FROM users WHERE id = ${userId}`;
  if (!userResult[0]) redirect("/onboarding");

  return <DebateClient roomId={roomId} userId={userId} />;
}