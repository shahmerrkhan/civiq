import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { endpoint, keys } = await req.json();
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    await db
      .insert(pushSubscriptions)
      .values({ userId, endpoint, p256dh: keys.p256dh, auth: keys.auth })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { userId, p256dh: keys.p256dh, auth: keys.auth },
      });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
