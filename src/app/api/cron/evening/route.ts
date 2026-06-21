import { NextResponse } from "next/server";
import webpush from "web-push";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";

const MESSAGES = [
  { title: "Evening update 🌙", body: "What developed in Ontario politics today. 2 minutes.", url: "/daily" },
  { title: "Before you wind down 📰", body: "Today's Ontario digest is ready. Stay in the loop.", url: "/daily" },
  { title: "Your evening Ontario brief", body: "Catch up on today's stories before tomorrow.", url: "/daily" },
  { title: "End your day informed 🏛️", body: "See what the left, centre, and right said today.", url: "/daily" },
  { title: "Daily quiz is live 🧠", body: "Test what you learned today. Takes 60 seconds.", url: "/learn" },
];

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

    const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    const payload = JSON.stringify({ ...msg, tag: "evening-brief" });

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
