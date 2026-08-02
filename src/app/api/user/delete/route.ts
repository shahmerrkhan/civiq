import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { deleteAllUserData } from "@/lib/user-delete";

export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await deleteAllUserData(userId);

    // Delete from Clerk last. If this fails the DB rows are already gone, so
    // surface it loudly rather than leaving a signed-in account with no data.
    const client = await clerkClient();
    await client.users.deleteUser(userId);

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("Account delete error:", err);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
