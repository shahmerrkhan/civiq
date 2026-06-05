import { NextResponse } from "next/server";
import webpush from "web-push";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";

export async function GET(req: Request) {
  try {
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subs = await db.select().from(pushSubscriptions);
    if (!subs.length) return NextResponse.json({ sent: 0 });

    const payload = JSON.stringify({
      title: "Your weekly Ontario briefing is ready 📰",
      body: "Here's what happened in Ontario politics this week. Takes 3 minutes.",
      url: "/pulse",
      tag: "weekly-pulse",
    });

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    );

    const sent = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected").length;
    console.log(`Weekly pulse cron: ${sent} sent, ${failed} failed`);
    return NextResponse.json({ sent, failed });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
