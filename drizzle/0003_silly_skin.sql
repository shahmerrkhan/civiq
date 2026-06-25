ALTER TABLE "poll_votes" ALTER COLUMN "poll_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "poll_votes" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookmarks_user_id_idx" ON "bookmarks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "circle_members_circle_id_idx" ON "circle_members" USING btree ("circle_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "circle_members_user_id_idx" ON "circle_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "circle_members_unique" ON "circle_members" USING btree ("circle_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "poll_votes_poll_user_unique" ON "poll_votes" USING btree ("poll_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "storyline_follows_user_id_idx" ON "storyline_follows" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "storyline_follows_storyline_id_idx" ON "storyline_follows" USING btree ("storyline_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "swipe_reactions_user_id_idx" ON "swipe_reactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "swipe_reactions_card_id_idx" ON "swipe_reactions" USING btree ("card_db_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_activity_user_action_created_idx" ON "user_activity" USING btree ("user_id","action","created_at");