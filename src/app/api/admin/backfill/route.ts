import { NextResponse } from "next/server";
import { sql } from "@/db";

const USERS = [
  { id: "user_3EfrRDSAsWaajg3T0AxvhI8j5ji", email: "ryukisbacky@gmail.com" },
  { id: "user_3EfofzLjgHRrA6XMJBardWTOuQG", email: "masterryped4@gmail.com" },
  { id: "user_3Eflag76JOdq8O1tM45lyYsHRUY", email: "rehanmazid010@gmail.com" },
  { id: "user_3EeA0dwVOEPofBPTUvOgAdzYOMD", email: "neelam.zaka@gmail.com" },
  { id: "user_3Ed2Av6aBlVEhzlWip0FpNrmBlL", email: "geekrar09@gmail.com" },
  { id: "user_3Ebe9C8ppBPw7DLTYbMH52lz5vT", email: "m.shahmeer.khan8@gmail.com" },
];

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let inserted = 0;
  for (const user of USERS) {
    await sql`
      INSERT INTO users (id, email, username, onboarding_complete, streak_count, created_at)
      VALUES (${user.id}, ${user.email}, ${null}, false, 0, NOW())
      ON CONFLICT (id) DO NOTHING
    `;
    inserted++;
  }

  return NextResponse.json({ success: true, inserted });
}