import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const ADMIN_IDS = ["user_3FjyZGikYeG9xNJm9uDh06WkLJh", "user_3FlZv0AydohOEdXeSRpOMucj6VD"];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId || !ADMIN_IDS.includes(userId)) redirect("/dashboard");
  return <>{children}</>;
}
