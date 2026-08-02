import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron";
import webpush from "web-push";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

async function sendWithRetry(sub: typeof pushSubscriptions.$inferSelect, payload: string, retries = 2): Promise<"ok" | "dead" | "failed"> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      return "ok";
    } catch (err) {
      const e = err as { statusCode?: number };
      if (e?.statusCode === 410 || e?.statusCode === 404) return "dead";
      if (attempt === retries) return "failed";
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

    if (!isCronAuthorized(req)) {
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

    if (deadIds.length > 0) {
      await Promise.all(deadIds.map(id => db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id))));
    }

    console.log(`Weekly pulse cron: ${sent} sent, ${failed} failed, ${deadIds.length} cleaned`);
    return NextResponse.json({ sent, failed, cleaned: deadIds.length });
  } catch (err) {
    console.error("Weekly pulse cron error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

