import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DailyClient from "./DailyClient";

export default async function DailyPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <DailyClient />;
}