-- =============================================================================
-- Habito — Complete Database Migration
-- Part 1: Tables, enums, foreign keys (generated from Prisma schema)
-- Part 2: Custom triggers, indexes, constraints, and seeds
-- =============================================================================

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "unaccent" WITH SCHEMA "public";

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('active', 'disabled', 'deleted');

-- CreateEnum
CREATE TYPE "theme" AS ENUM ('light', 'dark', 'system');

-- CreateEnum
CREATE TYPE "role_name" AS ENUM ('super_admin', 'admin', 'moderator', 'user');

-- CreateEnum
CREATE TYPE "habit_frequency" AS ENUM ('daily', 'twice_daily', 'custom_daily', 'weekly', 'monthly', 'every_x_hours', 'quantity', 'time_based');

-- CreateEnum
CREATE TYPE "priority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "habit_log_status" AS ENUM ('completed', 'skipped', 'failed');

-- CreateEnum
CREATE TYPE "recovery_preset" AS ENUM ('no_smoking', 'no_alcohol', 'no_sugar', 'no_social_media', 'no_gambling', 'no_junk_food', 'no_caffeine', 'custom');

-- CreateEnum
CREATE TYPE "recovery_status" AS ENUM ('active', 'paused', 'completed');

-- CreateEnum
CREATE TYPE "journal_entry_type" AS ENUM ('morning', 'evening', 'free_write');

-- CreateEnum
CREATE TYPE "note_type" AS ENUM ('general', 'gym', 'workout_plan', 'meal_plan', 'meeting', 'idea', 'book', 'shopping', 'journal');

-- CreateEnum
CREATE TYPE "exercise_category" AS ENUM ('strength', 'cardio', 'flexibility', 'hiit', 'sports', 'other');

-- CreateEnum
CREATE TYPE "equipment" AS ENUM ('barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'resistance_band', 'pullup_bar', 'other', 'none');

-- CreateEnum
CREATE TYPE "set_type" AS ENUM ('normal', 'warmup', 'dropset', 'failure');

-- CreateEnum
CREATE TYPE "pr_type" AS ENUM ('weight', 'reps', 'volume', 'e1rm', 'duration', 'distance');

-- CreateEnum
CREATE TYPE "goal_category" AS ENUM ('health', 'fitness', 'career', 'finance', 'relationships', 'learning', 'mental_health', 'self_care', 'other');

-- CreateEnum
CREATE TYPE "goal_type" AS ENUM ('short_term', 'medium_term', 'long_term');

-- CreateEnum
CREATE TYPE "progress_type" AS ENUM ('percentage', 'checklist', 'numeric');

-- CreateEnum
CREATE TYPE "goal_status" AS ENUM ('active', 'completed', 'abandoned');

-- CreateEnum
CREATE TYPE "time_block" AS ENUM ('morning', 'afternoon', 'evening', 'night');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('habit_reminder', 'recovery_checkin', 'streak_at_risk', 'goal_deadline', 'journal_prompt', 'achievement', 'weekly_recap', 'system', 'pr_record');

-- CreateEnum
CREATE TYPE "badge_category" AS ENUM ('streak', 'milestone', 'consistency', 'special');

-- CreateEnum
CREATE TYPE "xp_reason" AS ENUM ('habit_complete', 'streak_milestone', 'workout_logged', 'journal_entry', 'note_created', 'goal_milestone', 'goal_complete', 'recovery_day', 'badge_earned', 'relapse_honesty', 'onboarding_complete', 'admin_grant');

-- CreateEnum
CREATE TYPE "actor_type" AS ENUM ('user', 'admin', 'system');

-- CreateEnum
CREATE TYPE "impersonation_reason_category" AS ENUM ('bug_investigation', 'user_support', 'data_verification', 'other');

-- CreateEnum
CREATE TYPE "attachment_entity_type" AS ENUM ('note', 'habit', 'journal', 'workout', 'goal');

-- CreateEnum
CREATE TYPE "ai_context_type" AS ENUM ('coach', 'journal', 'habit', 'general');

-- CreateEnum
CREATE TYPE "ai_role" AS ENUM ('user', 'assistant', 'system');

-- CreateEnum
CREATE TYPE "ai_insight_type" AS ENUM ('weekly_summary', 'habit_prediction', 'recommendation', 'pattern');

-- CreateEnum
CREATE TYPE "feedback_type" AS ENUM ('bug', 'feature', 'complaint', 'praise', 'other');

-- CreateEnum
CREATE TYPE "feedback_status" AS ENUM ('open', 'reviewing', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "workout_status" AS ENUM ('in_progress', 'completed', 'discarded');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100),
    "avatar_url" TEXT,
    "bio" TEXT,
    "birthday" DATE,
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'UTC',
    "theme" "theme" NOT NULL DEFAULT 'system',
    "status" "user_status" NOT NULL DEFAULT 'active',
    "onboarding_done" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "notification_prefs" JSONB NOT NULL DEFAULT '{}',
    "privacy_settings" JSONB NOT NULL DEFAULT '{}',
    "dashboard_layout" JSONB NOT NULL DEFAULT '[]',
    "planner_config" JSONB NOT NULL DEFAULT '{}',
    "gym_config" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" "role_name" NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" UUID,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "user_agent" TEXT,
    "ip_address" VARCHAR(45),
    "device_name" VARCHAR(200),
    "last_active" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "family" UUID NOT NULL,
    "rotation_counter" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(7),
    "icon" VARCHAR(100),
    "is_global" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habit_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "category_id" UUID,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(100),
    "color" VARCHAR(7),
    "frequency_type" "habit_frequency" NOT NULL,
    "frequency_config" JSONB NOT NULL DEFAULT '{}',
    "priority" "priority" NOT NULL DEFAULT 'medium',
    "reminder_enabled" BOOLEAN NOT NULL DEFAULT false,
    "reminder_config" JSONB NOT NULL DEFAULT '{}',
    "start_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" DATE,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMPTZ(6),
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "total_completions" INTEGER NOT NULL DEFAULT 0,
    "success_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "last_completed_date" DATE,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "habit_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "log_date" DATE NOT NULL,
    "status" "habit_log_status" NOT NULL,
    "value" DECIMAL(10,2),
    "note" TEXT,
    "skip_reason" VARCHAR(200),
    "logged_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recovery_goals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "preset_type" "recovery_preset",
    "icon" VARCHAR(100),
    "color" VARCHAR(7),
    "personal_why" TEXT,
    "emergency_plan" TEXT,
    "start_date" TIMESTAMPTZ(6) NOT NULL,
    "status" "recovery_status" NOT NULL DEFAULT 'active',
    "current_streak_days" INTEGER NOT NULL DEFAULT 0,
    "longest_streak_days" INTEGER NOT NULL DEFAULT 0,
    "total_relapses" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "recovery_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relapse_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recovery_goal_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "relapsed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mood_before" SMALLINT,
    "triggers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "location" VARCHAR(100),
    "notes" TEXT,
    "plan_for_next" TEXT,
    "streak_broken" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relapse_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "entry_date" DATE NOT NULL,
    "entry_type" "journal_entry_type" NOT NULL,
    "mood_morning" SMALLINT,
    "energy_level" SMALLINT,
    "sleep_quality" SMALLINT,
    "sleep_hours" DECIMAL(4,1),
    "gratitude" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "intention" TEXT,
    "word_of_day" VARCHAR(50),
    "mood_evening" SMALLINT,
    "day_rating" SMALLINT,
    "wins" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lessons" TEXT,
    "would_do_diff" TEXT,
    "tomorrow_prio" TEXT,
    "stress_level" SMALLINT,
    "content" TEXT,
    "content_plain" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_draft" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_folders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "parent_id" UUID,
    "name" VARCHAR(200) NOT NULL,
    "color" VARCHAR(7),
    "icon" VARCHAR(100),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "note_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "folder_id" UUID,
    "title" VARCHAR(500) NOT NULL DEFAULT 'Untitled',
    "content" TEXT,
    "content_plain" TEXT,
    "note_type" "note_type" NOT NULL DEFAULT 'general',
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMPTZ(6),
    "word_count" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(7),
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_tag_map" (
    "note_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "note_tag_map_pkey" PRIMARY KEY ("note_id","tag_id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "entity_type" "attachment_entity_type" NOT NULL,
    "entity_id" UUID NOT NULL,
    "file_name" VARCHAR(500) NOT NULL,
    "file_key" TEXT NOT NULL,
    "file_url" TEXT,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size_bytes" BIGINT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "thumbnail_key" TEXT,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "category" "exercise_category" NOT NULL,
    "equipment" "equipment" NOT NULL DEFAULT 'none',
    "primary_muscles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "secondary_muscles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "instructions" TEXT,
    "video_url" TEXT,
    "image_url" TEXT,
    "is_global" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "estimated_duration_min" INTEGER,
    "category" VARCHAR(100),
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "times_used" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "workout_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_exercises" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "template_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "target_sets" INTEGER,
    "target_reps" VARCHAR(50),
    "target_weight" DECIMAL(8,2),
    "rest_seconds" INTEGER NOT NULL DEFAULT 90,
    "notes" TEXT,

    CONSTRAINT "template_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "template_id" UUID,
    "name" VARCHAR(200),
    "started_at" TIMESTAMPTZ(6) NOT NULL,
    "finished_at" TIMESTAMPTZ(6),
    "duration_seconds" INTEGER,
    "total_volume_kg" DECIMAL(10,2),
    "body_weight_kg" DECIMAL(6,2),
    "mood_before" SMALLINT,
    "effort_rating" SMALLINT,
    "notes" TEXT,
    "status" "workout_status" NOT NULL DEFAULT 'in_progress',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "workout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_exercises" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_sets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_exercise_id" UUID NOT NULL,
    "set_number" SMALLINT NOT NULL,
    "set_type" "set_type" NOT NULL DEFAULT 'normal',
    "weight_kg" DECIMAL(8,2),
    "reps" SMALLINT,
    "duration_seconds" INTEGER,
    "distance_meters" DECIMAL(10,2),
    "rpe" DECIMAL(3,1),
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "rest_seconds_taken" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "session_id" UUID,
    "pr_type" "pr_type" NOT NULL,
    "value" DECIMAL(12,4) NOT NULL,
    "achieved_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personal_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "body_measurements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "measured_at" DATE NOT NULL,
    "weight_kg" DECIMAL(6,2),
    "body_fat_pct" DECIMAL(5,2),
    "chest_cm" DECIMAL(6,2),
    "waist_cm" DECIMAL(6,2),
    "hips_cm" DECIMAL(6,2),
    "bicep_cm" DECIMAL(6,2),
    "thigh_cm" DECIMAL(6,2),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "body_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_photos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "measurement_id" UUID,
    "photo_key" TEXT NOT NULL,
    "photo_url" TEXT,
    "angle" VARCHAR(20) NOT NULL DEFAULT 'front',
    "taken_at" DATE NOT NULL,
    "notes" TEXT,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "category" "goal_category" NOT NULL,
    "goal_type" "goal_type" NOT NULL,
    "progress_type" "progress_type" NOT NULL DEFAULT 'percentage',
    "target_value" DECIMAL(15,2),
    "current_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "unit" VARCHAR(50),
    "progress_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "priority" "priority" NOT NULL DEFAULT 'medium',
    "target_date" DATE,
    "completed_at" TIMESTAMPTZ(6),
    "status" "goal_status" NOT NULL DEFAULT 'active',
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_milestones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "goal_id" UUID NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "target_value" DECIMAL(15,2),
    "target_date" DATE,
    "completed_at" TIMESTAMPTZ(6),
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "goal_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_habit_links" (
    "goal_id" UUID NOT NULL,
    "habit_id" UUID NOT NULL,

    CONSTRAINT "goal_habit_links_pkey" PRIMARY KEY ("goal_id","habit_id")
);

-- CreateTable
CREATE TABLE "planner_tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "goal_id" UUID,
    "plan_date" DATE NOT NULL,
    "time_block" "time_block" NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "notes" TEXT,
    "priority" SMALLINT NOT NULL DEFAULT 2,
    "estimated_min" INTEGER,
    "actual_min" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMPTZ(6),
    "carried_over" BOOLEAN NOT NULL DEFAULT false,
    "original_date" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "planner_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "notification_type" NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "body" TEXT,
    "deep_link" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ(6),
    "entity_type" VARCHAR(50),
    "entity_id" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "scheduled_at" TIMESTAMPTZ(6),
    "delivered_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "user_agent" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(100),
    "category" "badge_category" NOT NULL,
    "xp_reward" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "badge_id" UUID NOT NULL,
    "earned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "context" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_levels" (
    "user_id" UUID NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "total_xp" BIGINT NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_levels_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "xp_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" "xp_reason" NOT NULL,
    "entity_type" VARCHAR(50),
    "entity_id" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "xp_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "habits_scheduled" INTEGER NOT NULL DEFAULT 0,
    "habits_completed" INTEGER NOT NULL DEFAULT 0,
    "habits_skipped" INTEGER NOT NULL DEFAULT 0,
    "habit_completion_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "mood_morning" SMALLINT,
    "mood_evening" SMALLINT,
    "energy_level" SMALLINT,
    "stress_level" SMALLINT,
    "sleep_quality" SMALLINT,
    "sleep_hours" DECIMAL(4,1),
    "workout_count" SMALLINT NOT NULL DEFAULT 0,
    "workout_volume_kg" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "journal_written" BOOLEAN NOT NULL DEFAULT false,
    "notes_created" SMALLINT NOT NULL DEFAULT 0,
    "tasks_scheduled" INTEGER NOT NULL DEFAULT 0,
    "tasks_completed" INTEGER NOT NULL DEFAULT 0,
    "recovery_days" SMALLINT NOT NULL DEFAULT 0,
    "xp_earned" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "daily_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "life_balance_scores" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "week_start" DATE NOT NULL,
    "health_score" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "fitness_score" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "career_score" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "finance_score" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "relationships_score" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "learning_score" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "mental_health_score" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "self_care_score" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "overall_score" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "score_metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "life_balance_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_id" UUID,
    "actor_type" "actor_type" NOT NULL,
    "action" VARCHAR(200) NOT NULL,
    "entity_type" VARCHAR(100),
    "entity_id" UUID,
    "old_value" JSONB,
    "new_value" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "request_id" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impersonation_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "admin_id" UUID NOT NULL,
    "target_user_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "reason_category" "impersonation_reason_category" NOT NULL,
    "ip_address" VARCHAR(45) NOT NULL,
    "user_agent" TEXT,
    "session_token_id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),
    "auto_expired" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "impersonation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "rollout_pct" SMALLINT NOT NULL DEFAULT 100,
    "config" JSONB NOT NULL DEFAULT '{}',
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_settings" (
    "key" VARCHAR(200) NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "global_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "error_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "request_id" UUID,
    "user_id" UUID,
    "path" TEXT,
    "method" VARCHAR(10),
    "status_code" SMALLINT,
    "error_code" VARCHAR(100),
    "message" TEXT,
    "stack_trace" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_feedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "type" "feedback_type" NOT NULL,
    "subject" VARCHAR(300),
    "body" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "status" "feedback_status" NOT NULL DEFAULT 'open',
    "admin_note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" VARCHAR(300),
    "model" VARCHAR(100),
    "context_type" "ai_context_type" NOT NULL,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "role" "ai_role" NOT NULL,
    "content" TEXT NOT NULL,
    "tokens_used" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_insights" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "insight_type" "ai_insight_type" NOT NULL,
    "title" VARCHAR(300),
    "content" TEXT NOT NULL,
    "data_sources" JSONB NOT NULL DEFAULT '[]',
    "period_start" DATE,
    "period_end" DATE,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_family_idx" ON "refresh_tokens"("family");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_hash_key" ON "email_verification_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "email_verification_tokens_user_id_idx" ON "email_verification_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "habit_categories_user_id_idx" ON "habit_categories"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "habit_categories_user_id_name_key" ON "habit_categories"("user_id", "name");

-- CreateIndex
CREATE INDEX "habits_user_id_is_archived_idx" ON "habits"("user_id", "is_archived");

-- CreateIndex
CREATE INDEX "habits_category_id_idx" ON "habits"("category_id");

-- CreateIndex
CREATE INDEX "habits_user_id_last_completed_date_idx" ON "habits"("user_id", "last_completed_date");

-- CreateIndex
CREATE INDEX "habit_logs_habit_id_log_date_idx" ON "habit_logs"("habit_id", "log_date");

-- CreateIndex
CREATE INDEX "habit_logs_user_id_log_date_idx" ON "habit_logs"("user_id", "log_date");

-- CreateIndex
CREATE INDEX "habit_logs_habit_id_status_idx" ON "habit_logs"("habit_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "habit_logs_habit_id_log_date_key" ON "habit_logs"("habit_id", "log_date");

-- CreateIndex
CREATE INDEX "recovery_goals_user_id_idx" ON "recovery_goals"("user_id");

-- CreateIndex
CREATE INDEX "relapse_logs_recovery_goal_id_relapsed_at_idx" ON "relapse_logs"("recovery_goal_id", "relapsed_at");

-- CreateIndex
CREATE INDEX "relapse_logs_user_id_idx" ON "relapse_logs"("user_id");

-- CreateIndex
CREATE INDEX "journal_entries_user_id_entry_date_idx" ON "journal_entries"("user_id", "entry_date" DESC);

-- CreateIndex
CREATE INDEX "journal_entries_user_id_entry_type_idx" ON "journal_entries"("user_id", "entry_type");

-- CreateIndex
CREATE INDEX "journal_entries_user_id_mood_morning_mood_evening_entry_dat_idx" ON "journal_entries"("user_id", "mood_morning", "mood_evening", "entry_date");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_user_id_entry_date_entry_type_key" ON "journal_entries"("user_id", "entry_date", "entry_type");

-- CreateIndex
CREATE INDEX "note_folders_user_id_idx" ON "note_folders"("user_id");

-- CreateIndex
CREATE INDEX "note_folders_parent_id_idx" ON "note_folders"("parent_id");

-- CreateIndex
CREATE INDEX "notes_user_id_idx" ON "notes"("user_id");

-- CreateIndex
CREATE INDEX "notes_folder_id_idx" ON "notes"("folder_id");

-- CreateIndex
CREATE INDEX "notes_user_id_is_pinned_idx" ON "notes"("user_id", "is_pinned");

-- CreateIndex
CREATE INDEX "notes_user_id_note_type_idx" ON "notes"("user_id", "note_type");

-- CreateIndex
CREATE UNIQUE INDEX "note_tags_user_id_name_key" ON "note_tags"("user_id", "name");

-- CreateIndex
CREATE INDEX "note_tag_map_tag_id_idx" ON "note_tag_map"("tag_id");

-- CreateIndex
CREATE INDEX "attachments_entity_type_entity_id_idx" ON "attachments"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "attachments_user_id_idx" ON "attachments"("user_id");

-- CreateIndex
CREATE INDEX "exercises_is_global_idx" ON "exercises"("is_global");

-- CreateIndex
CREATE INDEX "exercises_user_id_idx" ON "exercises"("user_id");

-- CreateIndex
CREATE INDEX "exercises_category_idx" ON "exercises"("category");

-- CreateIndex
CREATE INDEX "workout_templates_user_id_idx" ON "workout_templates"("user_id");

-- CreateIndex
CREATE INDEX "template_exercises_template_id_idx" ON "template_exercises"("template_id");

-- CreateIndex
CREATE INDEX "workout_sessions_user_id_started_at_idx" ON "workout_sessions"("user_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "workout_sessions_user_id_status_idx" ON "workout_sessions"("user_id", "status");

-- CreateIndex
CREATE INDEX "session_exercises_session_id_idx" ON "session_exercises"("session_id");

-- CreateIndex
CREATE INDEX "exercise_sets_session_exercise_id_idx" ON "exercise_sets"("session_exercise_id");

-- CreateIndex
CREATE INDEX "personal_records_user_id_exercise_id_pr_type_idx" ON "personal_records"("user_id", "exercise_id", "pr_type");

-- CreateIndex
CREATE INDEX "personal_records_user_id_achieved_at_idx" ON "personal_records"("user_id", "achieved_at" DESC);

-- CreateIndex
CREATE INDEX "body_measurements_user_id_measured_at_idx" ON "body_measurements"("user_id", "measured_at" DESC);

-- CreateIndex
CREATE INDEX "progress_photos_user_id_taken_at_idx" ON "progress_photos"("user_id", "taken_at" DESC);

-- CreateIndex
CREATE INDEX "goals_user_id_status_idx" ON "goals"("user_id", "status");

-- CreateIndex
CREATE INDEX "goals_user_id_category_idx" ON "goals"("user_id", "category");

-- CreateIndex
CREATE INDEX "goals_user_id_target_date_idx" ON "goals"("user_id", "target_date");

-- CreateIndex
CREATE INDEX "goal_milestones_goal_id_idx" ON "goal_milestones"("goal_id");

-- CreateIndex
CREATE INDEX "goal_milestones_goal_id_target_date_idx" ON "goal_milestones"("goal_id", "target_date");

-- CreateIndex
CREATE INDEX "planner_tasks_user_id_plan_date_idx" ON "planner_tasks"("user_id", "plan_date");

-- CreateIndex
CREATE INDEX "planner_tasks_goal_id_idx" ON "planner_tasks"("goal_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "notifications_scheduled_at_idx" ON "notifications"("scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "push_subscriptions_user_id_is_active_idx" ON "push_subscriptions"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "badges_slug_key" ON "badges"("slug");

-- CreateIndex
CREATE INDEX "user_badges_user_id_idx" ON "user_badges"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_user_id_badge_id_key" ON "user_badges"("user_id", "badge_id");

-- CreateIndex
CREATE INDEX "xp_transactions_user_id_created_at_idx" ON "xp_transactions"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "daily_snapshots_user_id_snapshot_date_idx" ON "daily_snapshots"("user_id", "snapshot_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "daily_snapshots_user_id_snapshot_date_key" ON "daily_snapshots"("user_id", "snapshot_date");

-- CreateIndex
CREATE INDEX "life_balance_scores_user_id_week_start_idx" ON "life_balance_scores"("user_id", "week_start" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "life_balance_scores_user_id_week_start_key" ON "life_balance_scores"("user_id", "week_start");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "impersonation_sessions_admin_id_created_at_idx" ON "impersonation_sessions"("admin_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "impersonation_sessions_target_user_id_idx" ON "impersonation_sessions"("target_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_key_key" ON "feature_flags"("key");

-- CreateIndex
CREATE INDEX "error_logs_created_at_idx" ON "error_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "error_logs_user_id_created_at_idx" ON "error_logs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "error_logs_status_code_idx" ON "error_logs"("status_code");

-- CreateIndex
CREATE INDEX "user_feedback_status_idx" ON "user_feedback"("status");

-- CreateIndex
CREATE INDEX "user_feedback_user_id_idx" ON "user_feedback"("user_id");

-- CreateIndex
CREATE INDEX "ai_conversations_user_id_idx" ON "ai_conversations"("user_id");

-- CreateIndex
CREATE INDEX "ai_messages_conversation_id_idx" ON "ai_messages"("conversation_id");

-- CreateIndex
CREATE INDEX "ai_insights_user_id_is_read_idx" ON "ai_insights"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "ai_insights_user_id_created_at_idx" ON "ai_insights"("user_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_categories" ADD CONSTRAINT "habit_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "habit_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_goals" ADD CONSTRAINT "recovery_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relapse_logs" ADD CONSTRAINT "relapse_logs_recovery_goal_id_fkey" FOREIGN KEY ("recovery_goal_id") REFERENCES "recovery_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relapse_logs" ADD CONSTRAINT "relapse_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_folders" ADD CONSTRAINT "note_folders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_folders" ADD CONSTRAINT "note_folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "note_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "note_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_tags" ADD CONSTRAINT "note_tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_tag_map" ADD CONSTRAINT "note_tag_map_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_tag_map" ADD CONSTRAINT "note_tag_map_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "note_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_note_fk" FOREIGN KEY ("entity_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_templates" ADD CONSTRAINT "workout_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_exercises" ADD CONSTRAINT "template_exercises_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "workout_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_exercises" ADD CONSTRAINT "template_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "workout_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "workout_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_sets" ADD CONSTRAINT "exercise_sets_session_exercise_id_fkey" FOREIGN KEY ("session_exercise_id") REFERENCES "session_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "workout_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_measurements" ADD CONSTRAINT "body_measurements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_photos" ADD CONSTRAINT "progress_photos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_photos" ADD CONSTRAINT "progress_photos_measurement_id_fkey" FOREIGN KEY ("measurement_id") REFERENCES "body_measurements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_milestones" ADD CONSTRAINT "goal_milestones_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_habit_links" ADD CONSTRAINT "goal_habit_links_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_habit_links" ADD CONSTRAINT "goal_habit_links_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planner_tasks" ADD CONSTRAINT "planner_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planner_tasks" ADD CONSTRAINT "planner_tasks_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_levels" ADD CONSTRAINT "user_levels_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_transactions" ADD CONSTRAINT "xp_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_snapshots" ADD CONSTRAINT "daily_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "life_balance_scores" ADD CONSTRAINT "life_balance_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impersonation_sessions" ADD CONSTRAINT "impersonation_sessions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impersonation_sessions" ADD CONSTRAINT "impersonation_sessions_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "global_settings" ADD CONSTRAINT "global_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_feedback" ADD CONSTRAINT "user_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- =============================================================================
-- PART 2: CUSTOM DDL (features Prisma cannot express natively)
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

INSERT INTO global_settings (key, value, description, updated_at) VALUES
  ('app_name',              '"Habito"',                    'Application display name',              NOW()),
  ('maintenance_mode',      'false',                       'Enable maintenance mode',               NOW()),
  ('max_habits_per_user',   '100',                         'Maximum habits a user can create',      NOW()),
  ('max_notes_per_user',    '10000',                       'Maximum notes per user',                NOW()),
  ('max_goals_per_user',    '50',                          'Maximum active goals per user',         NOW()),
  ('xp_multiplier',         '1.0',                         'Global XP multiplier (events/promotions)', NOW()),
  ('signup_enabled',        'true',                        'Allow new user registration',           NOW()),
  ('email_verification',    'true',                        'Require email verification on signup',  NOW())
ON CONFLICT (key) DO NOTHING;

INSERT INTO feature_flags (id, key, description, is_enabled, rollout_pct, updated_at) VALUES
  (gen_random_uuid(), 'ai_insights',           'AI-powered insights and recommendations', false, 0,   NOW()),
  (gen_random_uuid(), 'ai_coach',              'AI coaching chat interface',              false, 0,   NOW()),
  (gen_random_uuid(), 'social_sharing',        'Share achievements on social media',      false, 0,   NOW()),
  (gen_random_uuid(), 'impersonation_enabled', 'Allow admin user impersonation',          true,  100, NOW()),
  (gen_random_uuid(), 'push_notifications',    'Browser push notification support',       true,  100, NOW()),
  (gen_random_uuid(), 'yearly_recap',          'Generate yearly recap (Wrapped-style)',   false, 0,   NOW()),
  (gen_random_uuid(), 'export_data',           'Allow users to export all their data',    true,  100, NOW())
ON CONFLICT (key) DO NOTHING;
