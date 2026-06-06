import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { circles, circleMembers, circlePosts, users } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { CircleJoinSchema } from "@/lib/schemas";

// Seed the default circles if the table is empty
async function seedCirclesIfEmpty() {
  const existing = await db.select().from(circles).limit(1);
  if (existing.length > 0) return;

  const defaults = [
    { slug: "housing-crisis", title: "Housing Crisis", description: "Rent, zoning, affordability, and the future of Ontario's housing market.", category: "Economy", emoji: "🏠" },
    { slug: "healthcare", title: "Healthcare", description: "Wait times, privatization, OHIP, and what Ontario's health system actually needs.", category: "Healthcare", emoji: "🏥" },
    { slug: "climate-action", title: "Climate Action", description: "Carbon tax, greenbelt, transit, and Ontario's environmental future.", category: "Environment", emoji: "🌿" },
    { slug: "education", title: "Education", description: "Funding cuts, curriculum changes, OSAP, and what schools in Ontario should look like.", category: "Education", emoji: "📚" },
    { slug: "doug-ford-watch", title: "Doug Ford Watch", description: "PC government policies, decisions, controversies, and their real impact.", category: "Politics", emoji: "🏛️" },
    { slug: "indigenous-rights", title: "Indigenous Rights", description: "Land rights, treaties, MMIWG, and the relationship between Ontario and First Nations.", category: "Justice", emoji: "🪶" },
    { slug: "immigration", title: "Immigration", description: "Student visas, permanent residency, refugee policy, and Ontario's newcomer experience.", category: "Society", emoji: "🌍" },
    { slug: "cost-of-living", title: "Cost of Living", description: "Groceries, gas, wages, and why everything in Ontario feels more expensive.", category: "Economy", emoji: "💸" },
    { slug: "police-justice", title: "Police & Justice", description: "Reform, accountability, carding, and what justice actually looks like in Ontario.", category: "Justice", emoji: "⚖️" },
    { slug: "transit", title: "Transit & Infrastructure", description: "TTC, Metrolinx, GO, highways, and how Ontario moves people (or doesn't).", category: "Infrastructure", emoji: "🚇" },
  ];

  await db.insert(circles).values(defaults);
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    await seedCirclesIfEmpty();

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (slug) {
      // Single circle detail
      const circle = await db.select().from(circles).where(eq(circles.slug, slug)).limit(1);
      if (!circle[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const memberRows = await db.select().from(circleMembers).where(eq(circleMembers.circleId, circle[0].id));
      const memberCount = memberRows.length;

      // Leaning breakdown
      const leaningBreakdown = { left: 0, centre: 0, right: 0 };
      for (const m of memberRows) {
        if (m.leaning === "left") leaningBreakdown.left++;
        else if (m.leaning === "right") leaningBreakdown.right++;
        else leaningBreakdown.centre++;
      }

      let isMember = false;
      let myLeaning: string | null = null;
      if (userId) {
        const mine = memberRows.find(m => m.userId === userId);
        isMember = !!mine;
        myLeaning = mine?.leaning ?? null;
      }

      return NextResponse.json({ circle: circle[0], memberCount, leaningBreakdown, isMember, myLeaning });
    }

    // All circles list with member counts
    const allCircles = await db.select().from(circles).where(eq(circles.isActive, true));

    const withCounts = await Promise.all(
      allCircles.map(async (c) => {
        const members = await db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(circleMembers)
          .where(eq(circleMembers.circleId, c.id));
        const memberCount = members[0]?.count ?? 0;

        let isMember = false;
        if (userId) {
          const mine = await db
            .select()
            .from(circleMembers)
            .where(and(eq(circleMembers.circleId, c.id), eq(circleMembers.userId, userId)))
            .limit(1);
          isMember = mine.length > 0;
        }

        return { ...c, memberCount, isMember };
      })
    );

    const sorted = withCounts.sort((a, b) => b.memberCount - a.memberCount);
    return NextResponse.json({ circles: sorted });
  } catch (err) {
    console.error("Circles GET error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const parsed = CircleJoinSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    const { circleId } = parsed.data;

    const existing = await db
      .select()
      .from(circleMembers)
      .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId)))
      .limit(1);

    if (existing.length > 0) {
      // Leave
      await db.delete(circleMembers)
        .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId)));
      return NextResponse.json({ joined: false });
    }

    // Get user's leaning from compass
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    let leaning: string = "centre";
    if (user[0]?.compassPosition) {
      const pos = user[0].compassPosition as { x: number; y: number };
      if (pos.x < -0.2) leaning = "left";
      else if (pos.x > 0.2) leaning = "right";
      else leaning = "centre";
    }

    await db.insert(circleMembers).values({ circleId, userId, leaning });
    return NextResponse.json({ joined: true });
  } catch (err) {
    console.error("Circles POST error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}