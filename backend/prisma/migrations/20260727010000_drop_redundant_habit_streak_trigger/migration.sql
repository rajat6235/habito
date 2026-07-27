-- The application (habits.controller.ts logHabit/updateLog/deleteLog + streak.service.ts)
-- already fully and correctly owns streak/totalCompletions for regular habits: it gates
-- on wasAlreadyCompleted, handles backdated logs, and self-heals via recalculateHabitStreak.
-- This AFTER INSERT trigger duplicated that same increment unconditionally on every first
-- INSERT of a 'completed' log for today, double-counting total_completions/current_streak
-- on a habit's first completion each day (confirmed: it never even fires for backdated
-- logs, since it only matches log_date = CURRENT_DATE — it was already partial/inconsistent).
-- Same class of bug as the recovery-relapse and event-habit trigger fixes earlier.
DROP TRIGGER IF EXISTS habit_log_streak_trigger ON "habit_logs";
DROP FUNCTION IF EXISTS update_habit_streak_on_log();
