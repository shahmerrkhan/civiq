import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { sql } from "@/db";
import DebateLobbyClient, { type Room } from "./DebateLobbyClient";

export default async function DebateLobbyPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const userResult = await sql`SELECT compass_position FROM users WHERE id = ${userId}`;
  if (!userResult[0]) redirect("/onboarding");

  const rooms = await sql`
    SELECT dr.id, dr.card_title, dr.card_summary, dr.status, dr.expires_at,
           dr.user_a_id, dr.user_b_id, dr.user_a_leaning, dr.user_b_leaning
    FROM debate_rooms dr
    WHERE dr.user_a_id = ${userId} OR dr.user_b_id = ${userId}
    ORDER BY dr.created_at DESC
    LIMIT 20
  `;

  return <DebateLobbyClient userId={userId} rooms={rooms as unknown as Room[]} />;
}

