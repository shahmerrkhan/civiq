import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { sql } from "@/db";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

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

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `Generate one "Today I Learned" political fact for young Canadians in Ontario. It must be:
- Genuinely surprising or counterintuitive
- Specific — include real numbers, dates, or names
- About Canadian or Ontario politics, history, or civics
- 2-3 sentences max

Return ONLY a JSON object, no markdown:
{"fact": "...", "category": "one of: History | Systems | Economy | Rights | World"}`
      }],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
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
