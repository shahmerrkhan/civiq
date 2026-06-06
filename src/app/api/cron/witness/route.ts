import { NextRequest, NextResponse } from "next/server";
import { generateWeeklyWitnessEvents, resolveExpiredWitnessEvents } from "@/lib/witness";

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  return monday.toISOString().split("T")[0];
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await resolveExpiredWitnessEvents();
    const weekStart = getWeekStart();
    const events = await generateWeeklyWitnessEvents(weekStart);
    return NextResponse.json({ success: true, eventsGenerated: events.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}