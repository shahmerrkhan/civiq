import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import SwipeClient from "./SwipeClient";

export default async function SwipePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <SwipeClient />;
}
