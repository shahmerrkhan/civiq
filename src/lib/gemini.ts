import { GoogleGenAI } from "@google/genai";

export const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const GEMINI_TIMEOUT_MS = 15000;

interface GeminiParams {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  grounding?: boolean;
}

export async function geminiGenerate({
  prompt,
  model = "gemini-1.5-flash",
  maxTokens = 1000,
  temperature = 0.7,
  grounding = false,
}: GeminiParams): Promise<string> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Gemini request timed out")), GEMINI_TIMEOUT_MS)
  );

  const tools = grounding ? [{ googleSearch: {} }] : undefined;

  const result = await Promise.race([
    genai.models.generateContent({
      model,
      contents: prompt,
      config: {
        maxOutputTokens: maxTokens,
        temperature,
        ...(tools && { tools }),
      },
    }),
    timeout,
  ]);

  return result.text ?? "";
}