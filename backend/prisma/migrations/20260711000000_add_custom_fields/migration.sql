-- AlterTable
ALTER TABLE "habit_logs" ADD COLUMN IF NOT EXISTS "custom_field_values" JSONB;

-- AlterTable
ALTER TABLE "habits" ADD COLUMN IF NOT EXISTS "custom_fields" JSONB;
