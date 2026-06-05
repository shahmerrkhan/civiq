import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import MapClient from "./MapClient";

export default async function MapPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <MapClient />;
}