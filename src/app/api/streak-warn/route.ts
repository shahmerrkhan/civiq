import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron";
import webpush from "web-push";
import { db } from "@/db";
import { pushSubscriptions, users } from "@/db/schema";
import { gt } from "drizzle-orm";

  export async function POST(req: Request) {
try {
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );
    if (!isCronAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date().toISOString().split("T")[0];

    // Get all users with a streak > 0 who haven't logged activity today
    const allUsers = await db.select().from(users).where(gt(users.streakCount, 0));
    const atRisk = allUsers.filter(u => u.lastStreakDate !== today);

    if (!atRisk.length) return NextResponse.json({ sent: 0, reason: "No at-risk users" });

    const atRiskIds = atRisk.map(u => u.id);

    // Get their push subscriptions
    const allSubs = await db.select().from(pushSubscriptions);
    const subs = allSubs.filter(s => atRiskIds.includes(s.userId!));

    if (!subs.length) return NextResponse.json({ sent: 0, reason: "No subscriptions for at-risk users" });

    // Send personalised streak warning
    const results = await Promise.allSettled(
      subs.map((sub) => {
        const user = atRisk.find(u => u.id === sub.userId);
        const streak = user?.streakCount ?? 1;
        const payload = JSON.stringify({
          title: `Your ${streak}-day streak ends at midnight 🔥`,
          body: "Read one story before it resets. Takes 2 minutes.",
          url: "/daily",
          tag: "streak-warn",
        });
        return webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      })
    );

    const sent = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected").length;
    console.log(`Streak warn cron: ${sent} sent, ${failed} failed`);
    return NextResponse.json({ sent, failed });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

