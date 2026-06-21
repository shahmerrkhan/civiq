import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ExplainSchema } from "@/lib/schemas";
import { geminiGenerate } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await checkRateLimit(userId, "explain", 20);
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

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