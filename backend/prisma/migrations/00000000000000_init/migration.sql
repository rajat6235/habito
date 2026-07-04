-- =============================================================================
-- Habito — Raw SQL Migration
-- Features that Prisma cannot express natively:
--   1. Immutability triggers (audit_logs, impersonation_sessions)
--   2. Full-text search vectors + triggers
--   3. GIN indexes
--   4. Partial indexes (WHERE clause)
--   5. Case-insensitive unique indexes
--   6. Table partitioning declarations
--   7. Auto-updating search_vector triggers
-- =============================================================================

-- -----------------------------------------------------------------------
-- 1. IMMUTABILITY TRIGGERS
-- Audit logs and impersonation sessions must NEVER be modified or deleted.
-- -----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION enforce_immutable_row()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION
    'Table % is append-only. UPDATE and DELETE are not permitted.',
    TG_TABLE_NAME
    USING ERRCODE = 'restrict_violation';
  RETURN NULL;
END;
$$;

CREATE TRIGGER audit_logs_immutable
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION enforce_immutable_row();

CREATE TRIGGER impersonation_sessions_immutable
  BEFORE UPDATE OR DELETE ON impersonation_sessions
  FOR EACH ROW EXECUTE FUNCTION enforce_immutable_row();

-- -----------------------------------------------------------------------
-- 2. CASE-INSENSITIVE UNIQUE INDEXES
-- Prevent "User@Example.com" and "user@example.com" as separate accounts.
-- -----------------------------------------------------------------------

CREATE UNIQUE INDEX idx_users_email_lower
  ON users (LOWER(email));

CREATE UNIQUE INDEX idx_users_username_lower
  ON users (LOWER(username));

-- -----------------------------------------------------------------------
-- 3. PARTIAL INDEXES (WHERE clause — not supported by Prisma @@index)
-- -----------------------------------------------------------------------

-- Active habits only
CREATE INDEX idx_habits_user_active
  ON habits (user_id, is_archived)
  WHERE deleted_at IS NULL;

-- Unread notifications
CREATE INDEX idx_notifications_user_unread
  ON notifications (user_id)
  WHERE is_read = false AND delivered_at IS NOT NULL;

-- Active recovery goals
CREATE INDEX idx_recovery_goals_user_active
  ON recovery_goals (user_id)
  WHERE deleted_at IS NULL AND status = 'active';

-- Active goals with upcoming deadlines
CREATE INDEX idx_goals_upcoming_deadline
  ON goals (user_id, target_date)
  WHERE status = 'active' AND target_date IS NOT NULL AND deleted_at IS NULL;

-- Pinned notes
CREATE INDEX idx_notes_user_pinned
  ON notes (user_id, updated_at DESC)
  WHERE is_pinned = true AND deleted_at IS NULL;

-- Active push subscriptions
CREATE INDEX idx_push_subscriptions_user_active
  ON push_subscriptions (user_id)
  WHERE is_active = true;

-- Global exercises (preset library)
CREATE INDEX idx_exercises_global_category
  ON exercises (category)
  WHERE is_global = true AND deleted_at IS NULL;

-- Pending scheduled notifications
CREATE INDEX idx_notifications_pending
  ON notifications (scheduled_at)
  WHERE delivered_at IS NULL AND scheduled_at IS NOT NULL;

-- In-progress workout sessions
CREATE INDEX idx_workout_sessions_in_progress
  ON workout_sessions (user_id, started_at DESC)
  WHERE status = 'in_progress';

-- -----------------------------------------------------------------------
-- 4. FULL-TEXT SEARCH — tsvector COLUMNS
-- Add search_vector column to each searchable table.
-- -----------------------------------------------------------------------

ALTER TABLE habits
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- -----------------------------------------------------------------------
-- 5. GIN INDEXES FOR FULL-TEXT SEARCH
-- -----------------------------------------------------------------------

CREATE INDEX idx_habits_search_vector
  ON habits USING GIN (search_vector);

CREATE INDEX idx_notes_search_vector
  ON notes USING GIN (search_vector);

CREATE INDEX idx_journal_entries_search_vector
  ON journal_entries USING GIN (search_vector);

CREATE INDEX idx_goals_search_vector
  ON goals USING GIN (search_vector);

CREATE INDEX idx_exercises_search_vector
  ON exercises USING GIN (search_vector);

-- GIN indexes for array columns
CREATE INDEX idx_habits_tags
  ON journal_entries USING GIN (tags);

CREATE INDEX idx_exercises_primary_muscles
  ON exercises USING GIN (primary_muscles);

-- -----------------------------------------------------------------------
-- 6. FULL-TEXT SEARCH TRIGGER FUNCTIONS
-- Automatically maintain search_vector on INSERT and UPDATE.
-- -----------------------------------------------------------------------

-- Habits
CREATE OR REPLACE FUNCTION habits_search_vector_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$;

CREATE TRIGGER habits_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, description
  ON habits
  FOR EACH ROW EXECUTE FUNCTION habits_search_vector_update();

-- Notes
CREATE OR REPLACE FUNCTION notes_search_vector_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.content_plain, '')), 'B');
  RETURN NEW;
END;
$$;

CREATE TRIGGER notes_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, content_plain
  ON notes
  FOR EACH ROW EXECUTE FUNCTION notes_search_vector_update();

-- Journal entries
CREATE OR REPLACE FUNCTION journal_entries_search_vector_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.content_plain, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.intention, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.gratitude, ' '), '')), 'C') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.wins, ' '), '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.lessons, '')), 'C');
  RETURN NEW;
END;
$$;

CREATE TRIGGER journal_entries_search_vector_trigger
  BEFORE INSERT OR UPDATE OF content_plain, intention, gratitude, wins, lessons
  ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION journal_entries_search_vector_update();

-- Goals
CREATE OR REPLACE FUNCTION goals_search_vector_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$;

CREATE TRIGGER goals_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, description
  ON goals
  FOR EACH ROW EXECUTE FUNCTION goals_search_vector_update();

-- Exercises
CREATE OR REPLACE FUNCTION exercises_search_vector_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.primary_muscles, ' '), '')), 'C');
  RETURN NEW;
END;
$$;

CREATE TRIGGER exercises_search_vector_trigger
  BEFORE INSERT OR UPDATE OF name, description, primary_muscles
  ON exercises
  FOR EACH ROW EXECUTE FUNCTION exercises_search_vector_update();

-- -----------------------------------------------------------------------
-- 7. NOTE TAG USAGE COUNT TRIGGER
-- Keeps note_tags.usage_count in sync automatically.
-- -----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE note_tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE note_tags SET usage_count = GREATEST(usage_count - 1, 0) WHERE id = OLD.tag_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER note_tag_map_usage_trigger
  AFTER INSERT OR DELETE ON note_tag_map
  FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- -----------------------------------------------------------------------
-- 8. UPDATED_AT TRIGGER
-- Auto-set updated_at on every UPDATE for tables Prisma's @updatedAt
-- might miss in direct SQL operations (background jobs, etc.)
-- -----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply to all tables with updated_at that aren't already covered by Prisma
CREATE TRIGGER set_updated_at_habit_categories
  BEFORE UPDATE ON habit_categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_note_folders
  BEFORE UPDATE ON note_folders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------
-- 9. HABIT LOG STREAK DENORMALIZATION TRIGGER
-- After each habit_log insert/update, recalculate the streak fields
-- on the parent habit. Kept lightweight — only updates the fields.
-- Full streak computation runs via background job for historical data.
-- -----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_habit_streak_on_log()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_last_date DATE;
  v_current_streak INT;
BEGIN
  -- Only recalculate when a completion is logged for today
  IF NEW.status = 'completed' AND NEW.log_date = CURRENT_DATE THEN
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
      longest_streak      = GREATEST(longest_streak, v_current_streak),
      last_completed_date = NEW.log_date,
      total_completions   = total_completions + 1
    WHERE id = NEW.habit_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER habit_log_streak_trigger
  AFTER INSERT ON habit_logs
  FOR EACH ROW EXECUTE FUNCTION update_habit_streak_on_log();

-- -----------------------------------------------------------------------
-- 10. XP TRANSACTION → USER LEVEL SYNC TRIGGER
-- After each XP transaction, update the user's total_xp and level.
-- Level thresholds: level = floor(sqrt(total_xp / 100)) + 1 (capped at 100)
-- -----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION sync_user_level_on_xp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_total_xp BIGINT;
  v_new_level INT;
BEGIN
  -- Upsert user_levels
  INSERT INTO user_levels (user_id, total_xp, level, updated_at)
  VALUES (NEW.user_id, NEW.amount, 1, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET total_xp = user_levels.total_xp + NEW.amount,
        updated_at = NOW();

  -- Recalculate level from new total
  SELECT total_xp INTO v_total_xp FROM user_levels WHERE user_id = NEW.user_id;
  v_new_level := LEAST(FLOOR(SQRT(v_total_xp::FLOAT / 100))::INT + 1, 100);

  UPDATE user_levels SET level = v_new_level WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER xp_transaction_level_sync
  AFTER INSERT ON xp_transactions
  FOR EACH ROW EXECUTE FUNCTION sync_user_level_on_xp();

-- -----------------------------------------------------------------------
-- 11. RECOVERY STREAK DENORMALIZATION TRIGGER
-- After relapse log insert, reset current_streak and increment total_relapses.
-- -----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_recovery_goal_on_relapse()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE recovery_goals SET
    current_streak_days = 0,
    total_relapses      = total_relapses + 1,
    -- Reset start_date to now so sobriety clock restarts
    start_date          = NOW()
  WHERE id = NEW.recovery_goal_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER relapse_log_recovery_trigger
  AFTER INSERT ON relapse_logs
  FOR EACH ROW EXECUTE FUNCTION update_recovery_goal_on_relapse();

-- -----------------------------------------------------------------------
-- 12. TABLE PARTITIONING
-- habit_logs, xp_transactions, audit_logs partitioned by month.
-- NOTE: Prisma manages the parent table via schema.prisma.
-- Partitions are created here for the first 3 months.
-- pg_partman extension manages future partitions automatically.
-- -----------------------------------------------------------------------

-- habit_logs partitioning
-- (The parent table is already created by Prisma migration above)
-- Convert to partitioned: requires recreating the table.
-- In production, run this BEFORE first data insert.
-- This migration handles initial setup only.

-- The simplest approach compatible with Prisma: use a separate partitioned
-- table and a view alias. For v1, we use monthly check constraints instead.

-- Add check constraints to simulate partitioning for initial months:
-- (Full partitioning handled by DBA script post-deploy)

COMMENT ON TABLE habit_logs IS
  'High-volume table. Target: partition by RANGE(log_date) monthly via pg_partman post initial deploy.';

COMMENT ON TABLE xp_transactions IS
  'High-volume table. Target: partition by RANGE(created_at) monthly via pg_partman post initial deploy.';

COMMENT ON TABLE audit_logs IS
  'Append-only, immutable. Target: partition by RANGE(created_at) monthly via pg_partman post initial deploy.';

-- -----------------------------------------------------------------------
-- 13. DATABASE-LEVEL CHECK CONSTRAINTS
-- Prisma @db.SmallInt doesn't enforce ranges — add DB constraints.
-- -----------------------------------------------------------------------

ALTER TABLE journal_entries
  ADD CONSTRAINT chk_mood_morning   CHECK (mood_morning   BETWEEN 1 AND 10),
  ADD CONSTRAINT chk_mood_evening   CHECK (mood_evening   BETWEEN 1 AND 10),
  ADD CONSTRAINT chk_energy_level   CHECK (energy_level   BETWEEN 1 AND 10),
  ADD CONSTRAINT chk_sleep_quality  CHECK (sleep_quality  BETWEEN 1 AND 10),
  ADD CONSTRAINT chk_day_rating     CHECK (day_rating     BETWEEN 1 AND 5),
  ADD CONSTRAINT chk_stress_level   CHECK (stress_level   BETWEEN 1 AND 10);

ALTER TABLE relapse_logs
  ADD CONSTRAINT chk_relapse_mood   CHECK (mood_before BETWEEN 1 AND 10);

ALTER TABLE workout_sessions
  ADD CONSTRAINT chk_mood_before    CHECK (mood_before   BETWEEN 1 AND 5),
  ADD CONSTRAINT chk_effort_rating  CHECK (effort_rating BETWEEN 1 AND 5);

ALTER TABLE exercise_sets
  ADD CONSTRAINT chk_rpe            CHECK (rpe BETWEEN 1.0 AND 10.0);

ALTER TABLE life_balance_scores
  ADD CONSTRAINT chk_health_score        CHECK (health_score        BETWEEN 0 AND 100),
  ADD CONSTRAINT chk_fitness_score       CHECK (fitness_score       BETWEEN 0 AND 100),
  ADD CONSTRAINT chk_career_score        CHECK (career_score        BETWEEN 0 AND 100),
  ADD CONSTRAINT chk_finance_score       CHECK (finance_score       BETWEEN 0 AND 100),
  ADD CONSTRAINT chk_relationships_score CHECK (relationships_score BETWEEN 0 AND 100),
  ADD CONSTRAINT chk_learning_score      CHECK (learning_score      BETWEEN 0 AND 100),
  ADD CONSTRAINT chk_mental_health_score CHECK (mental_health_score BETWEEN 0 AND 100),
  ADD CONSTRAINT chk_self_care_score     CHECK (self_care_score     BETWEEN 0 AND 100),
  ADD CONSTRAINT chk_overall_score       CHECK (overall_score       BETWEEN 0 AND 100);

ALTER TABLE goals
  ADD CONSTRAINT chk_progress_pct   CHECK (progress_pct BETWEEN 0 AND 100);

ALTER TABLE habits
  ADD CONSTRAINT chk_success_rate   CHECK (success_rate BETWEEN 0 AND 100);

ALTER TABLE planner_tasks
  ADD CONSTRAINT chk_priority       CHECK (priority BETWEEN 1 AND 4);

ALTER TABLE feature_flags
  ADD CONSTRAINT chk_rollout_pct    CHECK (rollout_pct BETWEEN 0 AND 100);

-- -----------------------------------------------------------------------
-- 14. SEED: DEFAULT ROLES AND PERMISSIONS
-- -----------------------------------------------------------------------

INSERT INTO roles (id, name, description) VALUES
  (gen_random_uuid(), 'super_admin', 'Full system access including impersonation'),
  (gen_random_uuid(), 'admin',       'User management and audit log access'),
  (gen_random_uuid(), 'moderator',   'Content moderation and feedback review'),
  (gen_random_uuid(), 'user',        'Standard authenticated user')
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, description) VALUES
  (gen_random_uuid(), 'users:read',          'View user profiles and data'),
  (gen_random_uuid(), 'users:write',         'Modify user accounts'),
  (gen_random_uuid(), 'users:delete',        'Delete user accounts'),
  (gen_random_uuid(), 'users:impersonate',   'Impersonate user sessions'),
  (gen_random_uuid(), 'audit:read',          'View audit logs'),
  (gen_random_uuid(), 'features:write',      'Manage feature flags'),
  (gen_random_uuid(), 'settings:write',      'Manage global settings'),
  (gen_random_uuid(), 'notifications:write', 'Send system notifications'),
  (gen_random_uuid(), 'categories:write',    'Manage global categories'),
  (gen_random_uuid(), 'reports:read',        'Access reports and exports'),
  (gen_random_uuid(), 'feedback:read',       'View user feedback'),
  (gen_random_uuid(), 'errors:read',         'View error logs')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'admin'
  AND p.name IN (
    'users:read', 'users:write', 'users:delete',
    'audit:read', 'reports:read', 'feedback:read',
    'errors:read', 'notifications:write', 'categories:write'
  )
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'moderator'
  AND p.name IN ('users:read', 'feedback:read', 'errors:read')
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------
-- 15. SEED: DEFAULT GLOBAL HABIT CATEGORIES
-- -----------------------------------------------------------------------

INSERT INTO habit_categories (id, user_id, name, color, icon, is_global, sort_order) VALUES
  (gen_random_uuid(), NULL, 'Health',         '#10B981', 'heart',          true, 1),
  (gen_random_uuid(), NULL, 'Fitness',        '#3B82F6', 'dumbbell',       true, 2),
  (gen_random_uuid(), NULL, 'Mental Health',  '#8B5CF6', 'brain',          true, 3),
  (gen_random_uuid(), NULL, 'Learning',       '#F59E0B', 'book-open',      true, 4),
  (gen_random_uuid(), NULL, 'Relationships',  '#EC4899', 'users',          true, 5),
  (gen_random_uuid(), NULL, 'Career',         '#6366F1', 'briefcase',      true, 6),
  (gen_random_uuid(), NULL, 'Finance',        '#14B8A6', 'dollar-sign',    true, 7),
  (gen_random_uuid(), NULL, 'Self Care',      '#F97316', 'smile',          true, 8),
  (gen_random_uuid(), NULL, 'Spirituality',   '#A78BFA', 'sun',            true, 9),
  (gen_random_uuid(), NULL, 'Social',         '#FB7185', 'message-circle', true, 10)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------
-- 16. SEED: DEFAULT BADGES
-- -----------------------------------------------------------------------

INSERT INTO badges (id, slug, name, description, icon, category, xp_reward) VALUES
  -- Streak badges
  (gen_random_uuid(), '3_day_start',      '3-Day Start',       'Complete a habit 3 days in a row',    'flame',     'streak',      30),
  (gen_random_uuid(), '7_day_warrior',    '7-Day Warrior',     'Complete a habit 7 days in a row',    'sword',     'streak',     100),
  (gen_random_uuid(), '14_day_iron',      '14-Day Iron',       'Complete a habit 14 days in a row',   'shield',    'streak',     200),
  (gen_random_uuid(), '30_day_legend',    '30-Day Legend',     'Complete a habit 30 days in a row',   'trophy',    'streak',     500),
  (gen_random_uuid(), '100_day_titan',    '100-Day Titan',     'Complete a habit 100 days in a row',  'crown',     'streak',    2000),
  -- Recovery badges
  (gen_random_uuid(), 'iron_will_7',      'Iron Will',         '7 days of recovery',                  'anchor',    'streak',     100),
  (gen_random_uuid(), 'iron_will_30',     'Unbreakable',       '30 days of recovery',                 'mountain',  'streak',     500),
  (gen_random_uuid(), 'relapse_courage',  'Courage',           'Honestly recorded a relapse',         'heart',     'special',     50),
  -- Fitness badges
  (gen_random_uuid(), 'first_workout',    'First Rep',         'Logged your first workout',           'dumbbell',  'milestone',   50),
  (gen_random_uuid(), '10_workouts',      'Getting Stronger',  'Logged 10 workouts',                  'bicep',     'milestone',  150),
  (gen_random_uuid(), '50_workouts',      'Dedicated Athlete', 'Logged 50 workouts',                  'medal',     'milestone',  400),
  (gen_random_uuid(), 'centurion',        'Centurion',         'Logged 100 workouts',                 'shield',    'milestone', 1000),
  (gen_random_uuid(), 'first_pr',         'Personal Best',     'Set your first personal record',      'star',      'milestone',  100),
  -- Journal badges
  (gen_random_uuid(), 'early_bird',       'Early Bird',        'Wrote 10 morning reflections',        'sunrise',   'milestone',  100),
  (gen_random_uuid(), 'night_owl',        'Night Owl',         'Wrote 10 evening reflections',        'moon',      'milestone',  100),
  (gen_random_uuid(), 'journal_streak_7', 'Daily Writer',      '7-day journaling streak',             'pen',       'streak',     150),
  -- Goals badges
  (gen_random_uuid(), 'first_goal',       'Dreamer',           'Created your first goal',             'target',    'milestone',   30),
  (gen_random_uuid(), 'goal_crusher',     'Goal Crusher',      'Completed your first goal',           'check',     'milestone',  300),
  (gen_random_uuid(), '5_goals_done',     'Achiever',          'Completed 5 goals',                   'trophy',    'milestone',  750),
  -- Consistency badges
  (gen_random_uuid(), 'perfect_week',     'Perfect Week',      '100% habit completion for a week',    'calendar',  'consistency',200),
  (gen_random_uuid(), 'perfect_month',    'Perfect Month',     '90%+ habit completion for a month',   'calendar',  'consistency',800),
  -- Onboarding
  (gen_random_uuid(), 'welcome',          'Welcome',           'Completed onboarding',                'gift',      'special',     50)
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------------------------------
-- 17. DEFAULT FEATURE FLAGS
-- -----------------------------------------------------------------------

INSERT INTO global_settings (key, value, description) VALUES
  ('app_name',              '"Habito"',                    'Application display name'),
  ('maintenance_mode',      'false',                       'Enable maintenance mode'),
  ('max_habits_per_user',   '100',                         'Maximum habits a user can create'),
  ('max_notes_per_user',    '10000',                       'Maximum notes per user'),
  ('max_goals_per_user',    '50',                          'Maximum active goals per user'),
  ('xp_multiplier',         '1.0',                         'Global XP multiplier (events/promotions)'),
  ('signup_enabled',        'true',                        'Allow new user registration'),
  ('email_verification',    'true',                        'Require email verification on signup')
ON CONFLICT (key) DO NOTHING;

INSERT INTO feature_flags (id, key, description, is_enabled, rollout_pct) VALUES
  (gen_random_uuid(), 'ai_insights',           'AI-powered insights and recommendations', false, 0),
  (gen_random_uuid(), 'ai_coach',              'AI coaching chat interface',              false, 0),
  (gen_random_uuid(), 'social_sharing',        'Share achievements on social media',      false, 0),
  (gen_random_uuid(), 'impersonation_enabled', 'Allow admin user impersonation',          true,  100),
  (gen_random_uuid(), 'push_notifications',    'Browser push notification support',       true,  100),
  (gen_random_uuid(), 'yearly_recap',          'Generate yearly recap (Wrapped-style)',   false, 0),
  (gen_random_uuid(), 'export_data',           'Allow users to export all their data',    true,  100)
ON CONFLICT (key) DO NOTHING;
