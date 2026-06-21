import { NextResponse } from "next/server";
import { db } from "@/db";
import { storylines, storylineChapters } from "@/db/schema";
import { geminiGenerate } from "@/lib/gemini";

const STORYLINE_TOPICS = [
  { title: "Ontario's Municipal Zoning Overhaul", slug: "municipal-zoning-bill-185", status: "active", category: "Housing" },
  { title: "Ontario Greenbelt Controversy", slug: "greenbelt-controversy", status: "active", category: "Environment" },
  { title: "Ontario Education Funding Cuts", slug: "education-funding-cuts", status: "stalled", category: "Education" },
  { title: "Ontario Healthcare Privatization Debate", slug: "healthcare-privatization", status: "active", category: "Healthcare" },
  { title: "Ford Government and Housing Supply Crisis", slug: "housing-supply-crisis", status: "active", category: "Housing" },
];

async function generateStoryline(topic: typeof STORYLINE_TOPICS[0]) {
  const raw = await geminiGenerate({
    prompt: `You are a non-partisan Ontario political journalist writing for young Canadians aged 16-25.

Generate a storyline for: "${topic.title}"

Return ONLY valid JSON in this exact format, no other text:
{
  "summary": "2-3 sentence non-partisan summary of the overall issue and why it matters to Ontario youth",
  "chapters": [
    {
      "title": "Short chapter title",
      "summary": "2-3 sentence factual summary of what happened at this point in the story",
      "publishedAt": "YYYY-MM-DD"
    }
  ]
}

Requirements:
- 3 to 5 chapters in chronological order from oldest to newest
- Each chapter covers a real development in this Ontario political story
- Dates must be realistic and chronological
- Completely non-partisan, just facts
- Written for a 16-year-old audience`,
    temperature: 0.4,
    maxTokens: 1000,
    grounding: true,
  });

  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export async function POST(req: Request) {
  const { secret } = await req.json();
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = [];

  for (const topic of STORYLINE_TOPICS) {
    try {
      const existing = await db.select().from(storylines).where(
        (await import("drizzle-orm")).eq(storylines.slug, topic.slug)
      ).limit(1);
      if (existing.length > 0) {
        results.push({ slug: topic.slug, status: "skipped" });
        continue;
      }

      const generated = await generateStoryline(topic);

      const [inserted] = await db.insert(storylines).values({
        title: topic.title,
        slug: topic.slug,
        summary: generated.summary,
        status: topic.status,
        category: topic.category,
      }).returning();

      for (const ch of generated.chapters) {
        await db.insert(storylineChapters).values({
          storylineId: inserted.id,
          title: ch.title,
          summary: ch.summary,
          publishedAt: new Date(ch.publishedAt),
        });
      }

      results.push({ slug: topic.slug, status: "created" });
    } catch (e) {
      results.push({ slug: topic.slug, status: "error", error: String(e) });
    }
  }

  return NextResponse.json({ results });
}