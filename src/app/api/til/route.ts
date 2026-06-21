import { NextResponse } from "next/server";
import { sql } from "@/db";
import { geminiGenerate } from "@/lib/gemini";

export const revalidate = 0;

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];

    const cached = await sql`
      SELECT content FROM learn_cache WHERE slug = ${`til-${today}`}
    `;

    if (cached.length > 0) {
      return NextResponse.json({ til: cached[0].content });
    }

    const raw = await geminiGenerate({
      prompt: `Generate one "Today I Learned" political fact for young Canadians in Ontario. It must be:
- Genuinely surprising or counterintuitive
- Specific — include real numbers, dates, or names
- About Canadian or Ontario politics, history, or civics
- 2-3 sentences max

Return ONLY a JSON object, no markdown:
{"fact": "...", "category": "one of: History | Systems | Economy | Rights | World"}`,
      maxTokens: 300,
      grounding: true,
    });

    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    await sql`
      INSERT INTO learn_cache (slug, content) VALUES (${`til-${today}`}, ${parsed.fact})
      ON CONFLICT (slug) DO NOTHING
    `;

    return NextResponse.json({ til: parsed.fact, category: parsed.category });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}