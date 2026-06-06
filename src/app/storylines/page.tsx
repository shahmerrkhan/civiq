import { auth } from "@clerk/nextjs/server";
import StorylinesClient from "./StorylinesClient";

export default async function StorylinesPage() {
  const { userId } = await auth();
  return <StorylinesClient userId={userId ?? null} />;
}