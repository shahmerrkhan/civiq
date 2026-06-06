import { NextResponse } from "next/server";
import { db } from "@/db";
import { storylines, storylineChapters } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeStorylines = await db
    .select()
    .from(storylines)
    .where(eq(storylines.status, "active"));

  const results = [];

  for (const story of activeStorylines) {
    try {
      // get latest chapter so we know what's already been covered
      const existingChapters = await db
        .select()
        .from(storylineChapters)
        .where(eq(storylineChapters.storylineId, story.id))
        .orderBy(desc(storylineChapters.publishedAt));

      const latestChapter = existingChapters[0];
      const latestDate = latestChapter
        ? new Date(latestChapter.publishedAt ?? Date.now()).toISOString().slice(0, 10)
        : "2024-01-01";

      const today = new Date().toISOString().slice(0, 10);

      const res = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{
          role: "user",
          content: `You are a non-partisan Ontario political journalist writing for young Canadians aged 16-25.

The storyline is: "${story.title}"
Summary: "${story.summary}"
Last update covered: ${latestDate}
Today's date: ${today}

The most recent chapter title was: "${latestChapter?.title ?? "None yet"}"
The most recent chapter said: "${latestChapter?.summary ?? "No previous chapters"}"

Has there likely been a significant new development in this Ontario political story since ${latestDate}?

If YES, return JSON like this:
{
  "hasUpdate": true,
  "chapter": {
    "title": "Short title for the new development",
    "summary": "2-3 sentence factual non-partisan summary of what happened",
    "publishedAt": "${today}"
  }
}

If NO significant development has happened, return:
{
  "hasUpdate": false
}

Return ONLY valid JSON, no other text. Base your answer on realistic knowledge of Ontario politics.`
        }],
        temperature: 0.3,
        max_tokens: 400,
      });

      const text = res.choices[0]?.message?.content ?? "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      if (parsed.hasUpdate && parsed.chapter) {
        await db.insert(storylineChapters).values({
          storylineId: story.id,
          title: parsed.chapter.title,
          summary: parsed.chapter.summary,
          publishedAt: new Date(parsed.chapter.publishedAt),
        });

        // update the storyline's updatedAt
        await db
          .update(storylines)
          .set({ updatedAt: new Date() })
          .where(eq(storylines.id, story.id));

        results.push({ slug: story.slug, status: "updated", chapter: parsed.chapter.title });
      } else {
        results.push({ slug: story.slug, status: "no_update" });
      }
    } catch (e) {
      results.push({ slug: story.slug, status: "error", error: String(e) });
    }
  }

  return NextResponse.json({ results, ran: new Date().toISOString() });
}