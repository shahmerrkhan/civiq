import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { sql } from "@/db";

export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Delete all user data from every table
    await sql`DELETE FROM witness_watches WHERE user_id = ${userId}`;
    await sql`DELETE FROM storyline_follows WHERE user_id = ${userId}`;
    await sql`DELETE FROM storyline_opinions WHERE user_id = ${userId}`;
    await sql`DELETE FROM civic_challenge_completions WHERE user_id = ${userId}`;
    await sql`DELETE FROM civic_challenge_streaks WHERE user_id = ${userId}`;
    await sql`DELETE FROM forecast_predictions WHERE user_id = ${userId}`;
    await sql`DELETE FROM forecast_leaderboard WHERE user_id = ${userId}`;
    await sql`DELETE FROM circle_post_likes WHERE user_id = ${userId}`;
    await sql`DELETE FROM circle_posts WHERE user_id = ${userId}`;
    await sql`DELETE FROM circle_members WHERE user_id = ${userId}`;
    await sql`DELETE FROM debate_messages WHERE user_id = ${userId}`;
    await sql`DELETE FROM debate_rooms WHERE user_a_id = ${userId} OR user_b_id = ${userId}`;
    await sql`DELETE FROM poll_votes WHERE user_id = ${userId}`;
    await sql`DELETE FROM user_opinions WHERE user_id = ${userId}`;
    await sql`DELETE FROM swipe_reactions WHERE user_id = ${userId}`;
    await sql`DELETE FROM bookmarks WHERE user_id = ${userId}`;
    await sql`DELETE FROM user_progress WHERE user_id = ${userId}`;
    await sql`DELETE FROM user_activity WHERE user_id = ${userId}`;
    await sql`DELETE FROM push_subscriptions WHERE user_id = ${userId}`;
    await sql`DELETE FROM users WHERE id = ${userId}`;

    // Delete from Clerk last
    const client = await clerkClient();
    await client.users.deleteUser(userId);

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("Account delete error:", err);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
