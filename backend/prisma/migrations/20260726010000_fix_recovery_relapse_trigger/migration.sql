-- The relapse trigger duplicated work the application already does correctly in the same
-- transaction (current_streak_days reset, total_relapses increment), and additionally reset
-- start_date to NOW() on every relapse — silently discarding the true "recovery began on"
-- date that the history timeline/calendar and the "Edit start date" feature rely on being
-- immutable. current_streak_days is now kept accurate by the relapse-aware recoveryStreak
-- job instead (see backend/src/jobs/recoveryStreak.job.ts).
DROP TRIGGER IF EXISTS relapse_log_recovery_trigger ON relapse_logs;
DROP FUNCTION IF EXISTS update_recovery_goal_on_relapse();

-- One-time repair: total_relapses was double-incremented (once by the trigger above, once by
-- the application) for every relapse ever logged. Recompute it from the actual relapse_logs
-- rows, which were never themselves corrupted.
UPDATE recovery_goals rg
SET total_relapses = (
  SELECT COUNT(*) FROM relapse_logs rl WHERE rl.recovery_goal_id = rg.id
)
WHERE deleted_at IS NULL;

-- NOTE: start_date cannot be safely auto-repaired — once overwritten there is no reliable
-- source of truth for the original date. Affected goals need a one-time manual correction via
-- the existing "Edit start date" action in the Recovery UI.
