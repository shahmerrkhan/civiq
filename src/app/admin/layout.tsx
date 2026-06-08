import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const ADMIN_IDS = ["user_3Ebe9C8ppBPw7DLTYbMH52lz5vT", "user_3EhHcsl86ffTPyR3CpgqKS6Prnj"];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId || !ADMIN_IDS.includes(userId)) redirect("/dashboard");
  return <>{children}</>;
}
