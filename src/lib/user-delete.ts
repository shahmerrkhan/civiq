import { sql } from "@/db";

/**
 * Removes every row belonging to a user, in FK-safe order.
 *
 * Rows that OTHER users created against this user's content (likes and reports
 * on their circle posts, messages in their debate rooms) must be deleted first,
 * or the foreign keys reject the parent deletes and the whole transaction fails.
 *
 * Shared by the in-app "delete my account" route and the Clerk `user.deleted`
 * webhook so a deletion started from either side clears the same data.
 */
export async function deleteAllUserData(userId: string): Promise<void> {
  await sql.transaction([
    sql`DELETE FROM witness_watches WHERE user_id = ${userId}`,
    sql`DELETE FROM storyline_follows WHERE user_id = ${userId}`,
    sql`DELETE FROM storyline_opinions WHERE user_id = ${userId}`,
    sql`DELETE FROM civic_challenge_completions WHERE user_id = ${userId}`,
    sql`DELETE FROM civic_challenge_streaks WHERE user_id = ${userId}`,
    sql`DELETE FROM forecast_predictions WHERE user_id = ${userId}`,
    sql`DELETE FROM forecast_leaderboard WHERE user_id = ${userId}`,

    // Anyone's likes/reports on this user's posts, then this user's own.
    sql`DELETE FROM circle_post_likes
        WHERE post_id IN (SELECT id FROM circle_posts WHERE user_id = ${userId})`,
    sql`DELETE FROM circle_post_reports
        WHERE post_id IN (SELECT id FROM circle_posts WHERE user_id = ${userId})`,
    sql`DELETE FROM circle_post_likes WHERE user_id = ${userId}`,
    sql`DELETE FROM circle_post_reports WHERE reported_by = ${userId}`,
    // Replies by other users to this user's posts would dangle otherwise.
    sql`DELETE FROM circle_post_likes
        WHERE post_id IN (
          SELECT id FROM circle_posts
          WHERE parent_id IN (SELECT id FROM circle_posts WHERE user_id = ${userId})
        )`,
    sql`DELETE FROM circle_post_reports
        WHERE post_id IN (
          SELECT id FROM circle_posts
          WHERE parent_id IN (SELECT id FROM circle_posts WHERE user_id = ${userId})
        )`,
    sql`DELETE FROM circle_posts
        WHERE parent_id IN (SELECT id FROM circle_posts WHERE user_id = ${userId})`,
    sql`DELETE FROM circle_posts WHERE user_id = ${userId}`,
    sql`DELETE FROM circle_members WHERE user_id = ${userId}`,

    // The other participant's messages must go before the room itself.
    sql`DELETE FROM debate_messages
        WHERE room_id IN (
          SELECT id FROM debate_rooms
          WHERE user_a_id = ${userId} OR user_b_id = ${userId}
        )`,
    sql`DELETE FROM debate_messages WHERE user_id = ${userId}`,
    sql`DELETE FROM debate_rooms WHERE user_a_id = ${userId} OR user_b_id = ${userId}`,

    sql`DELETE FROM poll_votes WHERE user_id = ${userId}`,
    sql`DELETE FROM user_opinions WHERE user_id = ${userId}`,
    sql`DELETE FROM swipe_reactions WHERE user_id = ${userId}`,
    sql`DELETE FROM bookmarks WHERE user_id = ${userId}`,
    sql`DELETE FROM user_progress WHERE user_id = ${userId}`,
    sql`DELETE FROM user_activity WHERE user_id = ${userId}`,
    sql`DELETE FROM push_subscriptions WHERE user_id = ${userId}`,
    sql`DELETE FROM region_votes WHERE user_id = ${userId}`,
    sql`DELETE FROM daily_answers WHERE user_id = ${userId}`,
    sql`UPDATE feedback SET user_id = NULL WHERE user_id = ${userId}`,
    sql`DELETE FROM users WHERE id = ${userId}`,
  ]);
}
