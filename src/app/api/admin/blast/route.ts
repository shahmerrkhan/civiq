import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import webpush from "web-push";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";

const ADMIN_IDS = ["user_3Ebe9C8ppBPw7DLTYbMH52lz5vT"];

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId || !ADMIN_IDS.includes(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    webpush.setVapidDetails(
      process.env.VAPID_EMAIL!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    const { title, body, url } = await req.json();
    if (!title?.trim() || !body?.trim()) {
      return NextResponse.json({ error: "Title and body required" }, { status: 400 });
    }

    const subs = await db.select().from(pushSubscriptions);
    if (!subs.length) return NextResponse.json({ sent: 0, failed: 0 });

    const payload = JSON.stringify({
      title: title.trim(),
      body: body.trim(),
      url: url?.trim() || "/dashboard",
      tag: "admin-blast",
    });

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    return NextResponse.json({ sent, failed });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}