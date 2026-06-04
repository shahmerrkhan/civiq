import { pgTable, text, timestamp, boolean, integer, uuid, jsonb } from "drizzle-orm/pg-core";

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
});

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
  pollId: text("poll_id"),
  userId: text("user_id").references(() => users.id),
  optionIndex: integer("option_index").notNull(),
  userLeaning: text("user_leaning"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userOpinions = pgTable("user_opinions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id),
  cardId: uuid("card_id").references(() => contentCards.id),
  opinion: text("opinion").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

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
});

export const bookmarks = pgTable("bookmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id),
  cardDbId: text("card_db_id"),
  cardTitle: text("card_title").notNull(),
  cardSummary: text("card_summary").notNull(),
  cardCategory: text("card_category"),
  cardSource: text("card_source"),
  savedAt: timestamp("saved_at").defaultNow(),
});

export const swipeReactions = pgTable("swipe_reactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id),
  cardDbId: text("card_db_id").notNull(),
  reaction: text("reaction").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userActivity = pgTable("user_activity", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id),
  action: text("action").notNull(),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at").defaultNow(),
});