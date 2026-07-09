import { z } from "zod";

// Already used
export const OnboardingSchema = z.object({
  compassPosition: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

export const OpinionSchema = z.object({
  cardId: z.string().uuid(),
  opinion: z.string().min(1).max(2000),
});

export const VoteSchema = z.object({
  pollId: z.string(),
  optionIndex: z.number().int().min(0),
});

export const DailyAnswerSchema = z.object({
  questionId: z.string().uuid(),
  answerIndex: z.number().int().min(0).max(3),
});

// New ones below

export const BookmarkSchema = z.object({
  cardTitle: z.string().min(1).max(500),
  cardSummary: z.string().min(1).max(2000),
  cardCategory: z.string().max(100).optional(),
  cardSource: z.string().max(200).optional(),
  cardDbId: z.string().optional(),
});

export const ReactionSchema = z.object({
  cardDbId: z.string().min(1),
  reaction: z.enum(["fire", "thinking", "disagree", "bookmark"]),
});

export const RegionVoteSchema = z.object({
  issueId: z.string().min(1),
  regionId: z.string().min(1),
  stance: z.enum(["left", "right", "centre"]),
});

export const DebateMessageSchema = z.object({
  roomId: z.string().uuid(),
  type: z.enum(["steelman", "argument"]),
  content: z.string().min(20).max(3000),
  steelmanApproved: z.boolean().optional(),
});

export const DebateRoomSchema = z.object({
  cardDbId: z.string().min(1),
  cardTitle: z.string().min(1).max(500),
  cardSummary: z.string().min(1).max(2000),
  userLeaning: z.enum(["Left", "Centre", "Right"]).optional(),
});

export const SteelmanSchema = z.object({
  content: z.string().min(20).max(3000),
  cardTitle: z.string().min(1).max(500),
  opposingLeaning: z.string().min(1),
});

export const ExplainSchema = z.object({
  title: z.string().min(1).max(500),
  summary: z.string().min(1).max(2000),
});

export const StorylineOpinionSchema = z.object({
  storylineId: z.string().uuid(),
  chapterId: z.string().uuid().optional(),
  opinion: z.string().min(1).max(2000),
});

export const StorylineFollowSchema = z.object({
  storylineId: z.string().uuid(),
});

export const PushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export const AdminBlastSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(500),
  url: z.string().optional(),
});

export const AdminCardPatchSchema = z.object({
  id: z.string().uuid(),
  approved: z.boolean(),
});

export const AdminCardDeleteSchema = z.object({
  id: z.string().uuid(),
});
export const WitnessWatchSchema = z.object({
  eventId: z.string().uuid(),
});

export const ForecastPredictSchema = z.object({
  questionId: z.string().uuid(),
  prediction: z.boolean(),
  confidence: z.number().int().min(50).max(100),
});

export const ProgressSchema = z.object({
  slug: z.string().min(1).max(200),
});

export const CirclePostSchema = z.object({
  circleId: z.string().uuid(),
  content: z.string().min(1).max(280),
  parentId: z.string().uuid().optional(),
});

export const CircleLikeSchema = z.object({
  postId: z.string().uuid(),
});

export const CircleJoinSchema = z.object({
  circleId: z.string().uuid(),
});

export const FeedbackSchema = z.object({
  email: z.string().email().optional(),
  category: z.enum(["general", "bug", "idea", "support"]).default("general"),
  message: z.string().min(5).max(2000),
});