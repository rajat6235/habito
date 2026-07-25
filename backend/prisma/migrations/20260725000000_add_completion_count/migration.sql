-- AlterTable: add completion_count to habit_logs (was in schema but migration was missing)
ALTER TABLE "habit_logs" ADD COLUMN IF NOT EXISTS "completion_count" SMALLINT NOT NULL DEFAULT 1;
