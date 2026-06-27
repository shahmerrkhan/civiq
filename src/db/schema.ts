import { pgTable, text, timestamp, boolean, integer, uuid, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  username: text("username"),
  compassPosition: jsonb("compass_position"),
  onboardingComplete: boolean("onboarding_complete").default(false),
  streakCount: integer("streak_count").default(0),
  lastStreakDate: text("last_streak_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const learningPaths = pgTable("learning_paths", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const modules = pgTable("modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  pathId: uuid("path_id").references(() => learningPaths.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  orderIndex: integer("order_index").notNull(),
  estimatedMinutes: integer("estimated_minutes").default(5),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userProgress = pgTable("user_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id),
  moduleSlug: text("module_slug"),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
}, (t) => [index("user_progress_user_id_idx").on(t.userId)]);

export const contentCards = pgTable("content_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  category: text("category"),
  sourceName: text("source_name"),
  sourceUrl: text("source_url"),
  perspectives: jsonb("perspectives"),
  approved: boolean("approved").default(false),
  publishedAt: timestamp("published_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  deepDive: text("deep_dive"),
  stat: text("stat"),
});

export const polls = pgTable("polls", {
  id: uuid("id").primaryKey().defaultRandom(),
  cardId: uuid("card_id").references(() => contentCards.id),
  question: text("question").notNull(),
  options: jsonb("options").notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pollVotes = pgTable("poll_votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  pollId: text("poll_id").notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  optionIndex: integer("option_index").notNull(),
  userLeaning: text("user_leaning"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("poll_votes_user_id_idx").on(t.userId),
  uniqueIndex("poll_votes_poll_user_unique").on(t.pollId, t.userId),
]);

export const storylines = pgTable("storylines", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  summary: text("summary").notNull(),
  status: text("status").notNull().default("active"), // 'active' | 'stalled' | 'passed' | 'defeated'
  category: text("category"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const storylineChapters = pgTable("storyline_chapters", {
  id: uuid("id").primaryKey().defaultRandom(),
  storylineId: uuid("storyline_id").references(() => storylines.id),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  publishedAt: timestamp("published_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const storylineFollows = pgTable("storyline_follows", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id),
  storylineId: uuid("storyline_id").references(() => storylines.id),
  followedAt: timestamp("followed_at").defaultNow(),
}, (t) => [
  index("storyline_follows_user_id_idx").on(t.userId),
  index("storyline_follows_storyline_id_idx").on(t.storylineId),
]);

export const storylineOpinions = pgTable("storyline_opinions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id),
  storylineId: uuid("storyline_id").references(() => storylines.id),
  chapterId: uuid("chapter_id").references(() => storylineChapters.id),
  opinion: text("opinion").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
export const userOpinions = pgTable("user_opinions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id),
  cardId: uuid("card_id").references(() => contentCards.id),
  opinion: text("opinion").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [index("user_opinions_user_id_idx").on(t.userId)]);

export const learnCache = pgTable("learn_cache", {
  slug: text("slug").primaryKey(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const feedCache = pgTable("feed_cache", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: jsonb("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pulseCache = pgTable("pulse_cache", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: jsonb("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyQuestions = pgTable("daily_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  question: text("question").notNull(),
  options: jsonb("options").notNull(),
  correctIndex: integer("correct_index").notNull(),
  explanation: text("explanation").notNull(),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyAnswers = pgTable("daily_answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id),
  questionId: uuid("question_id").references(() => dailyQuestions.id),
  answerIndex: integer("answer_index").notNull(),
  correct: boolean("correct").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [index("daily_answers_user_id_idx").on(t.userId)]);

export const bookmarks = pgTable("bookmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id),
  cardDbId: text("card_db_id"),
  cardTitle: text("card_title").notNull(),
  cardSummary: text("card_summary").notNull(),
  cardCategory: text("card_category"),
  cardSource: text("card_source"),
  savedAt: timestamp("saved_at").defaultNow(),
}, (t) => [index("bookmarks_user_id_idx").on(t.userId)]);

export const swipeReactions = pgTable("swipe_reactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id),
  cardDbId: text("card_db_id").notNull(),
  reaction: text("reaction").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("swipe_reactions_user_id_idx").on(t.userId),
  index("swipe_reactions_card_id_idx").on(t.cardDbId),
]);

export const userActivity = pgTable("user_activity", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id),
  action: text("action").notNull(),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("user_activity_user_action_created_idx").on(t.userId, t.action, t.createdAt),
]);

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const debateRooms = pgTable("debate_rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  cardDbId: text("card_db_id").notNull(),
  cardTitle: text("card_title").notNull(),
  cardSummary: text("card_summary").notNull(),
  userAId: text("user_a_id").references(() => users.id),
  userBId: text("user_b_id").references(() => users.id),
  userALeaning: text("user_a_leaning"),
  userBLeaning: text("user_b_leaning"),
  status: text("status").default("waiting"), // waiting | active | closed
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const debateMessages = pgTable("debate_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id").references(() => debateRooms.id),
  userId: text("user_id").references(() => users.id),
  type: text("type").notNull(), // steelman | argument
  content: text("content").notNull(),
  steelmanApproved: boolean("steelman_approved"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const regionVotes = pgTable("region_votes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  issueId: text("issue_id").notNull(),
  regionId: text("region_id").notNull(),
  stance: text("stance").notNull(), // "left", "right", "centre"
  createdAt: timestamp("created_at").defaultNow(),
}); 

export const civicChallenges = pgTable("civic_challenges", {
  id: uuid("id").primaryKey().defaultRandom(),
  weekStart: text("week_start").notNull(), // "2025-06-02" (Monday date)
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // "read" | "learn" | "vote" | "opinion"
  xpReward: integer("xp_reward").notNull().default(50),
  targetId: text("target_id"), // optional — cardId, moduleSlug, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const civicChallengeCompletions = pgTable("civic_challenge_completions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id),
  challengeId: uuid("challenge_id").references(() => civicChallenges.id),
  completedAt: timestamp("completed_at").defaultNow(),
});
export const forecastQuestions = pgTable("forecast_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  question: text("question").notNull(),
  context: text("context").notNull(),           // 2-3 sentence background
  category: text("category").notNull(),
  closesAt: timestamp("closes_at").notNull(),   // when voting locks
  resolvesAt: timestamp("resolves_at").notNull(), // when Gemini checks outcome
  status: text("status").notNull().default("pending"), // 'pending' | 'open' | 'closed' | 'resolved'
  outcome: boolean("outcome"),                  // true = Yes happened, false = No
  outcomeExplanation: text("outcome_explanation"),
  weekStart: text("week_start").notNull(),      // "2025-06-09"
  createdAt: timestamp("created_at").defaultNow(),
});

export const forecastPredictions = pgTable("forecast_predictions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id),
  questionId: uuid("question_id").references(() => forecastQuestions.id),
  prediction: boolean("prediction").notNull(), // true = Yes, false = No
  confidence: integer("confidence").notNull(), // 50–100
  pointsEarned: integer("points_earned"),      // null until resolved
  createdAt: timestamp("created_at").defaultNow(),
});

export const forecastLeaderboard = pgTable("forecast_leaderboard", {
  userId: text("user_id").primaryKey().references(() => users.id),
  totalPoints: integer("total_points").notNull().default(0),
  totalPredictions: integer("total_predictions").notNull().default(0),
  correctPredictions: integer("correct_predictions").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const witnessEvents = pgTable("witness_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  deadlineAt: timestamp("deadline_at").notNull(),
  status: text("status").notNull().default("pending"), // 'pending' | 'upcoming' | 'resolved'
  outcome: text("outcome"),
  outcomeExplanation: text("outcome_explanation"),
  sourceUrl: text("source_url"),
  weekStart: text("week_start").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const witnessWatches = pgTable("witness_watches", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id),
  eventId: uuid("event_id").references(() => witnessEvents.id),
  watchedAt: timestamp("watched_at").defaultNow(),
}, (t) => [
  uniqueIndex("witness_watches_unique").on(t.userId, t.eventId),
  index("witness_watches_user_id_idx").on(t.userId),
  index("witness_watches_event_id_idx").on(t.eventId),
]);

export const civicChallengeStreaks = pgTable("civic_challenge_streaks", {
  userId: text("user_id").primaryKey().references(() => users.id),
  currentStreak: integer("current_streak").notNull().default(0),
  lastCompletedWeek: text("last_completed_week"), // "2025-06-02"
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const circles = pgTable("circles", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  emoji: text("emoji").notNull().default("🏛️"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const circleMembers = pgTable("circle_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  circleId: uuid("circle_id").references(() => circles.id),
  userId: text("user_id").references(() => users.id),
  leaning: text("leaning"),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (t) => [
  index("circle_members_circle_id_idx").on(t.circleId),
  index("circle_members_user_id_idx").on(t.userId),
  uniqueIndex("circle_members_unique").on(t.circleId, t.userId),
]);

export const circlePosts = pgTable("circle_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  circleId: uuid("circle_id").references(() => circles.id),
  userId: text("user_id").references(() => users.id),
  username: text("username"),
  content: text("content").notNull(),
  leaning: text("leaning"), // "left" | "centre" | "right"
  parentId: uuid("parent_id"), // null = top-level post, set = reply
  likeCount: integer("like_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("circle_posts_circle_id_idx").on(t.circleId),
  index("circle_posts_user_id_idx").on(t.userId),
  index("circle_posts_parent_id_idx").on(t.parentId),
]);

export const circlePostLikes = pgTable("circle_post_likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").references(() => circlePosts.id),
  userId: text("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  uniqueIndex("circle_post_likes_unique").on(t.postId, t.userId),
  index("circle_post_likes_post_id_idx").on(t.postId),
]);

export const circlePostReports = pgTable("circle_post_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").references(() => circlePosts.id),
  reportedBy: text("reported_by").references(() => users.id),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("circle_post_reports_post_id_idx").on(t.postId),
  index("circle_post_reports_user_id_idx").on(t.reportedBy),
  uniqueIndex("circle_post_reports_unique").on(t.postId, t.reportedBy),
]);