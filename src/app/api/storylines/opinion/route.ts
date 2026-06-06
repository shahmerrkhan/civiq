import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { storylineOpinions } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { StorylineOpinionSchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = StorylineOpinionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  const { storylineId, chapterId, opinion } = parsed.data;

  await db.insert(storylineOpinions).values({ userId, storylineId, chapterId, opinion });
  return NextResponse.json({ success: true });
}