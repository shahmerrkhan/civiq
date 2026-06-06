import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import OntarioClient from "./OntarioClient";

export default async function OntarioPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <OntarioClient />;
}