import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { circlePosts, circlePostLikes, circleMembers, users } from "@/db/schema";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { CirclePostSchema, CircleLikeSchema } from "@/lib/schemas";
import sanitizeHtml from "sanitize-html";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(req.url);
    const circleId = searchParams.get("circleId");
    const parentId = searchParams.get("parentId");

    if (!circleId) return NextResponse.json({ error: "Missing circleId" }, { status: 400 });

    const posts = await db
      .select()
      .from(circlePosts)
      .where(
        parentId
          ? and(eq(circlePosts.circleId, circleId), eq(circlePosts.parentId, parentId))
          : and(eq(circlePosts.circleId, circleId), sql`${circlePosts.parentId} is null`)
      )
      .orderBy(desc(circlePosts.createdAt))
      .limit(50);

    if (posts.length === 0) return NextResponse.json({ posts: [] });

    const postIds = posts.map(p => p.id);

    // Single query for all likes by this user
    const userLikes = userId
      ? await db.select({ postId: circlePostLikes.postId })
          .from(circlePostLikes)
          .where(and(inArray(circlePostLikes.postId, postIds), eq(circlePostLikes.userId, userId)))
      : [];
    const likedSet = new Set(userLikes.map(l => l.postId));

    // Single query for all reply counts
    const replyCounts = await db
      .select({
        parentId: circlePosts.parentId,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(circlePosts)
      .where(inArray(circlePosts.parentId, postIds))
      .groupBy(circlePosts.parentId);

    const replyCountMap: Record<string, number> = {};
    for (const r of replyCounts) {
      if (r.parentId) replyCountMap[r.parentId] = r.count;
    }

    const enriched = posts.map(p => ({
      ...p,
      liked: likedSet.has(p.id),
      replyCount: replyCountMap[p.id] ?? 0,
    }));

    return NextResponse.json({ posts: enriched });
  } catch (err) {
    console.error("Circles posts GET error:", err);
    return NextResponse.json({ error: "Failed to load posts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const parsed = CirclePostSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });

    const { circleId, content, parentId } = parsed.data;

    // Content sanity check

    const trimmed = sanitizeHtml(content.trim(), { allowedTags: [], allowedAttributes: {} });
    if (trimmed.length < 1 || trimmed.length > 280) {
      return NextResponse.json({ error: "Content must be 1–280 characters" }, { status: 400 });
    }

    // Batch: membership + user in parallel
    const [membership, user] = await Promise.all([
      db.select().from(circleMembers)
        .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId)))
        .limit(1),
      db.select({ username: users.username, leaning: circleMembers.leaning })
        .from(users)
        .leftJoin(circleMembers, and(eq(circleMembers.userId, users.id), eq(circleMembers.circleId, circleId)))
        .where(eq(users.id, userId))
        .limit(1),
    ]);

    if (membership.length === 0) return NextResponse.json({ error: "Join the circle first" }, { status: 403 });

    const username = user[0]?.username ?? "Anonymous";
    const leaning = membership[0]?.leaning ?? "centre";

    const [post] = await db.insert(circlePosts).values({
      circleId, userId, username,
      content: trimmed,
      leaning,
      parentId: parentId ?? null,
    }).returning();

    return NextResponse.json({ post: { ...post, liked: false, replyCount: 0 } });
  } catch (err) {
    console.error("Circles posts POST error:", err);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const parsed = CircleLikeSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    const { postId } = parsed.data;

    // Verify post exists
    const post = await db.select({ id: circlePosts.id }).from(circlePosts).where(eq(circlePosts.id, postId)).limit(1);
    if (post.length === 0) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const existing = await db.select().from(circlePostLikes)
      .where(and(eq(circlePostLikes.postId, postId), eq(circlePostLikes.userId, userId)))
      .limit(1);

    if (existing.length > 0) {
      await Promise.all([
        db.delete(circlePostLikes).where(and(eq(circlePostLikes.postId, postId), eq(circlePostLikes.userId, userId))),
        db.update(circlePosts).set({ likeCount: sql`greatest(0, ${circlePosts.likeCount} - 1)` }).where(eq(circlePosts.id, postId)),
      ]);
      return NextResponse.json({ liked: false });
    }

    await Promise.all([
      db.insert(circlePostLikes).values({ postId, userId }),
      db.update(circlePosts).set({ likeCount: sql`${circlePosts.likeCount} + 1` }).where(eq(circlePosts.id, postId)),
    ]);
    return NextResponse.json({ liked: true });
  } catch (err) {
    console.error("Circles posts PATCH error:", err);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}
