import { NextRequest, NextResponse } from "next/server";
import { generateWeeklyWitnessEvents, resolveExpiredWitnessEvents } from "@/lib/witness";
import { isCronAuthorized } from "@/lib/cron";

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  return monday.toISOString().split("T")[0];
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3, label = "operation"): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      console.error(`${label} failed (attempt ${attempt}/${retries}):`, err);
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  throw new Error(`${label} exhausted retries`);
}

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await withRetry(() => resolveExpiredWitnessEvents(), 3, "resolveExpiredWitnessEvents");
    const weekStart = getWeekStart();
    const events = await withRetry(() => generateWeeklyWitnessEvents(weekStart), 3, "generateWeeklyWitnessEvents");
    console.log(`Witness cron: resolved expired + generated ${events.length} events for ${weekStart}`);
    return NextResponse.json({ success: true, eventsGenerated: events.length, weekStart });
  } catch (err) {
    console.error("Witness cron failed after retries:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}