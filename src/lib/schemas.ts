import { z } from "zod";

// Already used
export const OnboardingSchema = z.object({
  compassPosition: z.object({
    x: z.number(),
    y: z.number(),
  }),
  // Express consent for the weekly email (CASL). Absent means not subscribed.
  digestSubscribed: z.boolean().default(false),
});

export const DigestSubscribeSchema = z.object({
  subscribed: z.boolean(),
});

export const OpinionSchema = z.object({
  cardId: z.string().uuid(),
  opinion: z.string().min(1).max(2000),
});

export const VoteSchema = z.object({
  pollId: z.string().uuid(),
  optionIndex: z.number().int().min(0).max(19),
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

// Must stay in sync with ISSUES / REGIONS in src/app/map/MapClient.tsx.
// Unconstrained strings let anyone seed the public map aggregate with
// arbitrary region and issue keys.
export const MAP_ISSUE_IDS = [
  "housing-zoning", "education-cuts", "healthcare-privatization",
  "greenbelt", "carbon-tax", "minimum-wage",
] as const;

export const MAP_REGION_IDS = [
  "gta", "peel", "york", "durham", "hamilton", "waterloo", "ottawa",
  "london", "kingston", "sudbury", "windsor", "thunderbay", "barrie",
  "cambridge",
] as const;

export const RegionVoteSchema = z.object({
  issueId: z.enum(MAP_ISSUE_IDS),
  regionId: z.enum(MAP_REGION_IDS),
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
  // Same-origin relative paths only — this value is handed to the service
  // worker and passed to clients.openWindow().
  // The (?!\/) guard rejects protocol-relative URLs like //evil.com.
  url: z.string().regex(/^\/(?!\/)[A-Za-z0-9\-._~!$&'()*+,;=:@%\/?#]*$/).max(500).optional(),
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
export const CirclePostDeleteSchema = z.object({
  id: z.string().uuid(),
});

export const AdminForecastCreateSchema = z.object({
  question: z.string().min(1).max(500),
  context: z.string().min(1).max(2000),
  category: z.string().min(1).max(100),
  closesAt: z.coerce.date(),
  resolvesAt: z.coerce.date(),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const AdminForecastPatchSchema = z.object({
  id: z.string().uuid(),
  approvePending: z.boolean().optional(),
  outcome: z.boolean().optional(),
  outcomeExplanation: z.string().max(2000).optional(),
});

export const AdminWitnessCreateSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().min(1).max(2000),
  category: z.string().min(1).max(100),
  deadlineAt: z.coerce.date(),
  sourceUrl: z.string().url().max(1000).optional().nullable(),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const AdminWitnessPatchSchema = z.object({
  id: z.string().uuid(),
  approvePending: z.boolean().optional(),
  outcome: z.string().max(100).optional(),
  outcomeExplanation: z.string().max(2000).optional(),
});

export const AdminIdSchema = z.object({ id: z.string().uuid() });

export const AdminCardUpdateSchema = z.object({
  id: z.string().uuid(),
  approved: z.boolean().optional(),
  title: z.string().max(500).optional(),
  summary: z.string().max(4000).optional(),
  category: z.string().max(100).optional(),
  sourceName: z.string().max(200).optional(),
  sourceUrl: z.string().url().max(1000).optional().or(z.literal("")),
  deepDive: z.string().max(8000).optional(),
  stat: z.string().max(500).optional(),
});

export const AdminCardCreateSchema = z.object({
  title: z.string().min(1).max(500),
  summary: z.string().min(1).max(4000),
  category: z.string().max(100).optional().nullable(),
  sourceName: z.string().max(200).optional().nullable(),
  sourceUrl: z.string().url().max(1000).optional().nullable().or(z.literal("")),
  stat: z.string().max(500).optional().nullable(),
  deepDive: z.string().max(8000).optional().nullable(),
  perspectives: z.object({
    left: z.string().max(4000),
    centre: z.string().max(4000),
    right: z.string().max(4000),
  }).optional(),
  pollQuestion: z.string().max(500).optional().nullable(),
  pollOptions: z.array(z.string().min(1).max(200)).max(10).optional(),
});

export const PerspectiveViewSchema = z.object({
  cardDbId: z.string().uuid(),
  perspective: z.enum(["left", "centre", "right"]),
});
