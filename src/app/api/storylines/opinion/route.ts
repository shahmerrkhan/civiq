import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { storylineOpinions } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { storylineId, chapterId, opinion } = await req.json();
  if (!opinion?.trim()) return NextResponse.json({ error: "Opinion required" }, { status: 400 });

  await db.insert(storylineOpinions).values({ userId, storylineId, chapterId, opinion });
  return NextResponse.json({ success: true });
}