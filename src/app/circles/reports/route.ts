import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { circlePostReports, circlePosts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const { postId, reason } = body ?? {};

    if (!postId || typeof postId !== "string") {
      return NextResponse.json({ error: "Missing postId" }, { status: 400 });
    }
    if (!reason || typeof reason !== "string" || reason.trim().length < 1) {
      return NextResponse.json({ error: "Missing reason" }, { status: 400 });
    }

    // Check post exists
    const post = await db
      .select({ id: circlePosts.id })
      .from(circlePosts)
      .where(eq(circlePosts.id, postId))
      .limit(1);

    if (!post[0]) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    // One report per user per post (unique index handles this too)
    const existing = await db
      .select()
      .from(circlePostReports)
      .where(and(eq(circlePostReports.postId, postId), eq(circlePostReports.reportedBy, userId)))
      .limit(1);

    if (existing[0]) return NextResponse.json({ error: "Already reported" }, { status: 409 });

    await db.insert(circlePostReports).values({
      postId,
      reportedBy: userId,
      reason: reason.trim().slice(0, 500),
    });

    return NextResponse.json({ reported: true });
  } catch (err) {
    console.error("Report POST error:", err);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ADMIN_IDS = ["user_3FjyZGikYeG9xNJm9uDh06WkLJh", "user_3FlZv0AydohOEdXeSRpOMucj6VD"];
    if (!ADMIN_IDS.includes(userId)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const { id } = body ?? {};
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await db.delete(circlePostReports).where(eq(circlePostReports.id, id));
    return NextResponse.json({ dismissed: true });
  } catch (err) {
    console.error("Report DELETE error:", err);
    return NextResponse.json({ error: "Failed to dismiss report" }, { status: 500 });
  }
}
