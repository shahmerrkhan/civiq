import { NextResponse } from "next/server";
import { ExplainSchema } from "@/lib/schemas";
import { geminiGenerate } from "@/lib/gemini";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = ExplainSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const { title, summary } = parsed.data;

  try {
    const explanation = await geminiGenerate({
      prompt: `Explain this political news to a 16-year-old who knows nothing about politics. Plain casual language, no jargon, max 4 sentences. Be direct about why it matters to a young person in Ontario.

Story: "${title}"
Context: "${summary}"

Plain English explanation:`,
      maxTokens: 200,
      grounding: false,
    });

    return NextResponse.json({ explanation: explanation.trim() });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}