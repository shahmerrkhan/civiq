CREATE INDEX IF NOT EXISTS "daily_answers_user_id_idx" ON "daily_answers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "poll_votes_user_id_idx" ON "poll_votes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_opinions_user_id_idx" ON "user_opinions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_progress_user_id_idx" ON "user_progress" USING btree ("user_id");