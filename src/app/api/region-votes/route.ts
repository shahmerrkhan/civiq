import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { regionVotes } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { RegionVoteSchema } from "@/lib/schemas";

export async function POST(req: Request) {
const { searchParams } = new URL(req.url);
  const issueId = searchParams.get("issueId");
  if (!issueId) return NextResponse.json({ error: "Missing issueId" }, { status: 400 });

  const results = await db
    .select({
      regionId: regionVotes.regionId,
      stance: regionVotes.stance,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(regionVotes)
    .where(eq(regionVotes.issueId, issueId))
    .groupBy(regionVotes.regionId, regionVotes.stance);

  // Aggregate by region
  const byRegion: Record<string, { left: number; right: number; centre: number; total: number }> = {};
  for (const row of results) {
    if (!byRegion[row.regionId]) byRegion[row.regionId] = { left: 0, right: 0, centre: 0, total: 0 };
    byRegion[row.regionId][row.stance as "left" | "right" | "centre"] += row.count;
    byRegion[row.regionId].total += row.count;
  }

  // Check if current user already voted on this issue
  let userVote = null;
  const { userId } = await auth();
  if (userId) {
    const existing = await db
      .select()
      .from(regionVotes)
      .where(and(eq(regionVotes.userId, userId), eq(regionVotes.issueId, issueId)))
      .limit(1);
    if (existing[0]) {
      userVote = { regionId: existing[0].regionId, stance: existing[0].stance };
    }
  }

  return NextResponse.json({ byRegion, userVote });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = RegionVoteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  const { issueId, regionId, stance } = parsed.data;

  // Upsert — one vote per user per issue
  const existing = await db
    .select()
    .from(regionVotes)
    .where(and(eq(regionVotes.userId, userId), eq(regionVotes.issueId, issueId)))
    .limit(1);

  if (existing[0]) {
    await db
      .update(regionVotes)
      .set({ stance, regionId })
      .where(and(eq(regionVotes.userId, userId), eq(regionVotes.issueId, issueId)));
  } else {
    await db.insert(regionVotes).values({ userId, issueId, regionId, stance });
  }

  return NextResponse.json({ success: true });
}