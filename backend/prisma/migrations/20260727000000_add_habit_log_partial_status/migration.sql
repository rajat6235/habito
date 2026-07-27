-- Add 'partial' status: a multi-completion habit log that's been logged at least
-- once but hasn't reached its minimum-required completions yet. Every existing
-- consumer already filters on status = 'completed' specifically, so this is a
-- purely additive change — no other row is affected.
ALTER TYPE "habit_log_status" ADD VALUE IF NOT EXISTS 'partial';
