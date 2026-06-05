import { z } from "zod";

export const OnboardingSchema = z.object({
  compassPosition: z.object({
    x: z.number().min(-1).max(1),
    y: z.number().min(-1).max(1),
  }),
});

export const VoteSchema = z.object({
  pollId: z.string().uuid(),
  optionIndex: z.number().int().min(0).max(10),
});

export const OpinionSchema = z.object({
  cardId: z.string().min(1).max(100),
  opinion: z.string().min(1).max(2000).trim(),
});

export const BookmarkSchema = z.object({
  cardTitle: z.string().min(1).max(500),
  cardSummary: z.string().max(2000).optional(),
  cardCategory: z.string().max(100).optional(),
  cardSource: z.string().max(200).optional(),
});

export const DailyAnswerSchema = z.object({
  questionId: z.string().uuid(),
  answerIndex: z.number().int().min(0).max(3),
});
