import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import CirclesClient from "./CirclesClient";

export default async function CirclesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <CirclesClient userId={userId} />;
}