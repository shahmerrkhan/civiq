import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const ADMIN_IDS = ["user_3Ebe9C8ppBPw7DLTYbMH52lz5vT"]; // paste your Clerk user ID

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId || !ADMIN_IDS.includes(userId)) redirect("/dashboard");
  return <>{children}</>;
}