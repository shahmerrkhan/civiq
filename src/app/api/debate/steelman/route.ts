import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Groq from "groq-sdk";
import { SteelmanSchema } from "@/lib/schemas";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const parsed = SteelmanSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    const { content, cardTitle, opposingLeaning } = parsed.data;
    
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: `You are evaluating whether someone genuinely tried to understand the opposing political view before debating.

The political issue is: "${cardTitle}"
The opposing side is: ${opposingLeaning}
Their steelman attempt: "${content}"

A genuine steelman:
- Accurately represents the strongest version of the opposing argument
- Does not mock, strawman, or dismiss the other side
- Shows real understanding, not just "I guess some people think X"
- Is at least 2 sentences

Reply with ONLY a JSON object like this, no other text:
{"approved": true, "feedback": "Good — you captured the core argument well."}
or
{"approved": false, "feedback": "This feels dismissive. Try to explain WHY someone on the right would genuinely support this policy."}`,
      }],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ approved: false, feedback: "Could not evaluate. Please try again." });

    const result = JSON.parse(match[0]);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}