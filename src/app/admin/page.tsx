import { db } from "@/db";
export const dynamic = "force-dynamic";
import { contentCards, polls } from "@/db/schema";
import { desc } from "drizzle-orm";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const cards = await db
    .select()
    .from(contentCards)
    .orderBy(desc(contentCards.createdAt));

  const allPolls = await db
    .select()
    .from(polls);

  return <AdminClient cards={cards as any} polls={allPolls as any} />;
  }
