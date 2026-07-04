import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { bookmarks } from "@/db/schema";
import { eq } from "drizzle-orm";
import BookmarksClient, { type Bookmark } from "./BookmarksClient";

export default async function BookmarksPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const saved = await db
    .select()
    .from(bookmarks)
    .where(eq(bookmarks.userId, userId))
    .orderBy(bookmarks.savedAt);

  return <BookmarksClient bookmarks={saved as unknown as Bookmark[]} />;
}


