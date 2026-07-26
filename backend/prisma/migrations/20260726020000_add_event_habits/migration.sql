-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "habit_type" AS ENUM ('regular', 'event');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable: add habit_type, and event-based habits have no schedule so frequency_type
-- must become nullable for them.
ALTER TABLE "habits" ADD COLUMN IF NOT EXISTS "habit_type" "habit_type" NOT NULL DEFAULT 'regular';
ALTER TABLE "habits" ALTER COLUMN "frequency_type" DROP NOT NULL;

-- The streak trigger must not touch current_streak/longest_streak for event-based habits —
-- "streak" isn't a meaningful concept for them (see backend/src/api/v1/habits/habits.controller.ts,
-- which handles their totalCompletions/lastCompletedDate directly in application code instead,
-- since unlike this trigger it correctly supports backdated logs, not just log_date = today).
CREATE OR REPLACE FUNCTION update_habit_streak_on_log()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_last_date DATE;
  v_current_streak INT;
  v_habit_type "habit_type";
BEGIN
  IF NEW.status = 'completed' AND NEW.log_date = CURRENT_DATE THEN
    SELECT habit_type INTO v_habit_type FROM habits WHERE id = NEW.habit_id;

    IF v_habit_type = 'regular' THEN
      -- Get the previous completed date
      SELECT log_date INTO v_last_date
      FROM habit_logs
      WHERE habit_id = NEW.habit_id
        AND status = 'completed'
        AND log_date < NEW.log_date
      ORDER BY log_date DESC
      LIMIT 1;

      -- Determine new streak
      IF v_last_date IS NULL OR v_last_date < (NEW.log_date - INTERVAL '1 day') THEN
        v_current_streak := 1;
      ELSE
        SELECT current_streak + 1 INTO v_current_streak
        FROM habits WHERE id = NEW.habit_id;
      END IF;

      UPDATE habits SET
        current_streak      = v_current_streak,
        longest_streak       = GREATEST(longest_streak, v_current_streak),
        last_completed_date  = NEW.log_date,
        total_completions    = total_completions + 1
      WHERE id = NEW.habit_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
