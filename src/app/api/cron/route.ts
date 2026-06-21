import { NextResponse } from "next/server";
import webpush from "web-push";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

const MESSAGES = [
  { title: "Good morning 🌅", body: "Ontario's morning brief is ready. 2 minutes to stay informed.", url: "/daily" },
  { title: "Start your day informed 📰", body: "New Ontario stories just dropped. See what's happening.", url: "/daily" },
  { title: "Your morning Ontario brief", body: "3 issues. Left, centre, and right perspectives. Takes 2 minutes.", url: "/daily" },
  { title: "Don't break your streak 🔥", body: "Today's stories are live. Keep it going.", url: "/daily" },
  { title: "Ontario news, no spin ☀️", body: "What's happening in your province this morning.", url: "/daily" },
];

async function sendWithRetry(sub: typeof pushSubscriptions.$inferSelect, payload: string, retries = 2): Promise<"ok" | "dead" | "failed"> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      return "ok";
    } catch (err: any) {
      // 410 Gone = subscription expired, delete it
      if (err?.statusCode === 410 || err?.statusCode === 404) return "dead";
      if (attempt === retries) return "failed";
      // Wait before retry: 500ms, 1000ms
      await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  return "failed";
}

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
    const payload = JSON.stringify({ ...msg, tag: "daily-feed" });

    // Send in batches of 50 to avoid overwhelming the push service
    const BATCH_SIZE = 50;
    let sent = 0, failed = 0;
    const deadIds: string[] = [];

    for (let i = 0; i < subs.length; i += BATCH_SIZE) {
      const batch = subs.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(batch.map(sub => sendWithRetry(sub, payload)));
      for (let j = 0; j < results.length; j++) {
        if (results[j] === "ok") sent++;
        else if (results[j] === "dead") deadIds.push(batch[j].id);
        else failed++;
      }
    }

    // Clean up dead subscriptions
    if (deadIds.length > 0) {
      await Promise.all(deadIds.map(id => db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id))));
      console.log(`Removed ${deadIds.length} dead subscriptions`);
    }

    console.log(`Push cron: ${sent} sent, ${failed} failed, ${deadIds.length} cleaned`);
    return NextResponse.json({ sent, failed, cleaned: deadIds.length });
  } catch (err) {
    console.error("Push cron error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}