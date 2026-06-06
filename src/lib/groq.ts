import Groq from "groq-sdk";

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const GROQ_TIMEOUT_MS = 15000; // 15 seconds

type GroqChatParams = Parameters<typeof groq.chat.completions.create>[0];

export async function groqWithTimeout(
  params: GroqChatParams,
  timeoutMs = GROQ_TIMEOUT_MS
): Promise<Groq.Chat.ChatCompletion> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Groq request timed out")), timeoutMs)
  );

  return Promise.race([
    groq.chat.completions.create(params) as Promise<Groq.Chat.ChatCompletion>,
    timeout,
  ]);
}