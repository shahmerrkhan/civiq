import { NextResponse } from "next/server";
import { db } from "@/db";
import { dailyQuestions, dailyAnswers, userActivity } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { DailyAnswerSchema } from "@/lib/schemas";
import { geminiGenerate } from "@/lib/gemini";

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

export async function GET() {
  try {
  const { userId } = await auth();
  const today = getTodayDate();

  // Check if today's question already exists
  const existing = await db
    .select()
    .from(dailyQuestions)
    .where(eq(dailyQuestions.date, today))
    .limit(1);

  let question = existing[0];

  if (!question) {
    // Generate new question with Gemini
    try {
      const raw = await geminiGenerate({
  prompt: `Generate one Ontario politics trivia question for young Canadians (16-25). It must be about a real fact, law, policy, or political figure relevant to Ontario or Canada.

Return ONLY valid JSON, no markdown, no backticks:
{
  "question": "the question — clear and specific, max 20 words",
  "options": ["option A", "option B", "option C", "option D"],
  "correctIndex": 0,
  "explanation": "2-3 sentences explaining the correct answer and why it matters to young Ontarians"
}

Topics: Ontario legislature, provincial policies, Canadian political history, Doug Ford, healthcare, housing, education, minimum wage, Indigenous rights, environment. Make it genuinely interesting and educational, not trivial.`,
  maxTokens: 500,
  grounding: true,
});

const match = raw.match(/\{[\s\S]*\}/);
if (!match) throw new Error("No JSON");

const parsed = JSON.parse(match[0]);

      const inserted = await db.insert(dailyQuestions).values({
        question: parsed.question,
        options: parsed.options,
        correctIndex: parsed.correctIndex,
        explanation: parsed.explanation,
        date: today,
      }).returning();

      question = inserted[0];
    } catch (err) {
      return NextResponse.json({ error: "Could not generate question" }, { status: 500 });
    }
  }

  // Check if user already answered
  let userAnswer = null;
  if (userId) {
    const answered = await db
      .select()
      .from(dailyAnswers)
      .where(and(
        eq(dailyAnswers.userId, userId),
        eq(dailyAnswers.questionId, question.id)
      ))
      .limit(1);
    if (answered[0]) userAnswer = answered[0];
  }

  // Get answer distribution
  const allAnswers = await db
    .select()
    .from(dailyAnswers)
    .where(eq(dailyAnswers.questionId, question.id));

  const distribution = (question.options as string[]).map((_, i) =>
    allAnswers.filter(a => a.answerIndex === i).length
  );

  return NextResponse.json({
    question: {
      id: question.id,
      question: question.question,
      options: question.options,
      correctIndex: userAnswer ? question.correctIndex : null,
      explanation: userAnswer ? question.explanation : null,
    },
    userAnswer: userAnswer ? { answerIndex: userAnswer.answerIndex, correct: userAnswer.correct } : null,
    distribution,
    totalAnswers: allAnswers.length,
    date: today,
  });
  } catch (err) {
    console.error("Daily GET error:", err);
    return NextResponse.json({ error: "Failed to load question" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
    const parsed = DailyAnswerSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    const { questionId, answerIndex } = parsed.data;

  // Check already answered
  const existing = await db
    .select()
    .from(dailyAnswers)
    .where(and(eq(dailyAnswers.userId, userId), eq(dailyAnswers.questionId, questionId)))
    .limit(1);

  if (existing[0]) return NextResponse.json({ error: "Already answered" }, { status: 409 });

  const question = await db
    .select()
    .from(dailyQuestions)
    .where(eq(dailyQuestions.id, questionId))
    .limit(1);

  if (!question[0]) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  const correct = answerIndex === question[0].correctIndex;

await db.insert(dailyAnswers).values({
    userId,
    questionId,
    answerIndex,
    correct,
  });

  const points = correct ? 25 : 10;
  await db.insert(userActivity).values({
    userId,
    action: "daily_answer",
    meta: { xp: points, questionId, correct },
  }).catch(() => {});

  return NextResponse.json({
    correct,
    correctIndex: question[0].correctIndex,
    explanation: question[0].explanation,
    pointsAwarded: points,
  });
  } catch (err) {
    console.error("Daily POST error:", err);
    return NextResponse.json({ error: "Failed to submit answer" }, { status: 500 });
  }
}
