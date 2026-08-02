import { NextRequest, NextResponse } from "next/server";
import { generateWeeklyForecasts, closeExpiredVoting, resolveExpiredForecasts } from "@/lib/forecast";
import { isCronAuthorized } from "@/lib/cron";

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}

export async function GET(req: NextRequest) {
  // Protect with a secret so only Vercel Cron can call this
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await closeExpiredVoting();
    await resolveExpiredForecasts();
    const weekStart = getWeekStart();
    const questions = await generateWeeklyForecasts(weekStart);

    return NextResponse.json({
      success: true,
      weekStart,
      questionsGenerated: questions.length,
    });
  } catch (err) {
    console.error("Forecast cron error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}