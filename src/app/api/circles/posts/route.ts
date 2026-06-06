import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { circlePosts, circlePostLikes, circleMembers, users } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { CirclePostSchema, CircleLikeSchema } from "@/lib/schemas";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(req.url);
    const circleId = searchParams.get("circleId");
    const parentId = searchParams.get("parentId"); // if set, fetch replies to this post

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

    // Enrich: like status + reply count
    const enriched = await Promise.all(
      posts.map(async (p) => {
        let liked = false;
        if (userId) {
          const like = await db
            .select()
            .from(circlePostLikes)
            .where(and(eq(circlePostLikes.postId, p.id), eq(circlePostLikes.userId, userId)))
            .limit(1);
          liked = like.length > 0;
        }

        const replyCount = await db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(circlePosts)
          .where(eq(circlePosts.parentId, p.id));

        return { ...p, liked, replyCount: replyCount[0]?.count ?? 0 };
      })
    );

    return NextResponse.json({ posts: enriched });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
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

    // Must be a member to post
    const membership = await db
      .select()
      .from(circleMembers)
      .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId)))
      .limit(1);
    if (membership.length === 0) return NextResponse.json({ error: "Join the circle first" }, { status: 403 });

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const username = user[0]?.username ?? "Anonymous";
    const leaning = membership[0]?.leaning ?? "centre";

    const [post] = await db.insert(circlePosts).values({
      circleId,
      userId,
      username,
      content: content.trim(),
      leaning,
      parentId: parentId ?? null,
    }).returning();

    return NextResponse.json({ post: { ...post, liked: false, replyCount: 0 } });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  // Toggle like
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const parsed = CircleLikeSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    const { postId } = parsed.data;

    const existing = await db
      .select()
      .from(circlePostLikes)
      .where(and(eq(circlePostLikes.postId, postId), eq(circlePostLikes.userId, userId)))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(circlePostLikes)
        .where(and(eq(circlePostLikes.postId, postId), eq(circlePostLikes.userId, userId)));
      await db.update(circlePosts)
        .set({ likeCount: sql`${circlePosts.likeCount} - 1` })
        .where(eq(circlePosts.id, postId));
      return NextResponse.json({ liked: false });
    }

    await db.insert(circlePostLikes).values({ postId, userId });
    await db.update(circlePosts)
      .set({ likeCount: sql`${circlePosts.likeCount} + 1` })
      .where(eq(circlePosts.id, postId));
    return NextResponse.json({ liked: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}