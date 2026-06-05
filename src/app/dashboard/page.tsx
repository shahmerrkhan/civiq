import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { sql } from "@/db";
import DashboardClient from "./DashboardClient";
import StreakBadge from "@/components/StreakBadge";

export default async function Dashboard() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const result = await sql`SELECT onboarding_complete, compass_position FROM users WHERE id = ${userId}`;
  if (!result[0] || !result[0].onboarding_complete) redirect("/onboarding");

  return <DashboardClient compassPosition={result[0].compass_position} />;
}