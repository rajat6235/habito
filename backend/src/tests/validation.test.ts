import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../api/v1/auth/auth.validation';
import {
  createHabitSchema,
  updateHabitSchema,
  logHabitSchema,
  listHabitsQuerySchema,
  habitLogsQuerySchema,
  createCategorySchema,
} from '../api/v1/habits/habits.validation';
import {
  createRecoveryGoalSchema,
  updateRecoveryGoalSchema,
  logRelapseSchema,
} from '../api/v1/recovery/recovery.validation';
import {
  createGoalSchema,
  updateGoalSchema,
  updateGoalProgressSchema,
  createMilestoneSchema,
  listGoalsQuerySchema,
} from '../api/v1/goals/goals.validation';
import {
  createTaskSchema,
  updateTaskSchema,
  carryOverSchema,
} from '../api/v1/planner/planner.validation';
import {
  updateProfileSchema,
  changePasswordSchema,
} from '../api/v1/users/users.validation';
import {
  createJournalEntrySchema,
  listJournalQuerySchema,
} from '../api/v1/journal/journal.validation';

// ── Auth schemas ─────────────────────────────────────────────────────────────

describe('registerSchema', () => {
  const valid = {
    email:     'user@example.com',
    password:  'Str0ng!Pass',
    firstName: 'Alice',
    username:  'alice',
  };

  it('accepts a valid registration', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts mixed-case email (normalisation is service-layer)', () => {
    const r = registerSchema.safeParse({ ...valid, email: 'USER@Example.COM' });
    expect(r.success).toBe(true);
  });

  it('rejects a missing email', () => {
    const { email: _e, ...rest } = valid;
    expect(registerSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects a weak password (< 8 chars)', () => {
    expect(registerSchema.safeParse({ ...valid, password: 'abc123' }).success).toBe(false);
  });

  it('rejects an invalid email format', () => {
    expect(registerSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false);
  });

  it('rejects a username shorter than 3 chars', () => {
    expect(registerSchema.safeParse({ ...valid, username: 'ab' }).success).toBe(false);
  });

  it('rejects a username with illegal characters', () => {
    expect(registerSchema.safeParse({ ...valid, username: 'alice!' }).success).toBe(false);
  });

  it('accepts an optional lastName', () => {
    const r = registerSchema.safeParse({ ...valid, lastName: 'Smith' });
    expect(r.success && r.data.lastName).toBe('Smith');
  });
});

describe('loginSchema', () => {
  const valid = { email: 'user@example.com', password: 'secret', rememberMe: false };

  it('accepts a valid login', () => {
    expect(loginSchema.safeParse(valid).success).toBe(true);
  });

  it('defaults rememberMe to false', () => {
    const { rememberMe: _r, ...rest } = valid;
    const r = loginSchema.safeParse(rest);
    expect(r.success && r.data.rememberMe).toBe(false);
  });

  it('rejects a missing password', () => {
    const { password: _p, ...rest } = valid;
    expect(loginSchema.safeParse(rest).success).toBe(false);
  });
});

describe('forgotPasswordSchema', () => {
  it('accepts a valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'x@y.com' }).success).toBe(true);
  });

  it('rejects a missing email', () => {
    expect(forgotPasswordSchema.safeParse({}).success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('accepts valid token + password', () => {
    expect(resetPasswordSchema.safeParse({ token: 'abc', password: 'NewPass1!' }).success).toBe(true);
  });

  it('rejects a short password', () => {
    expect(resetPasswordSchema.safeParse({ token: 'abc', password: '123' }).success).toBe(false);
  });
});

// ── Habits schemas ────────────────────────────────────────────────────────────

describe('createHabitSchema', () => {
  const daily = { type: 'daily' as const };
  const valid = {
    title:           'Meditate',
    frequencyConfig: daily,
  };

  it('accepts a minimal valid habit', () => {
    expect(createHabitSchema.safeParse(valid).success).toBe(true);
  });

  it('sets default priority to medium', () => {
    const r = createHabitSchema.safeParse(valid);
    expect(r.success && r.data.priority).toBe('medium');
  });

  it('sets default reminderEnabled to false', () => {
    const r = createHabitSchema.safeParse(valid);
    expect(r.success && r.data.reminderEnabled).toBe(false);
  });

  it('rejects an empty title', () => {
    expect(createHabitSchema.safeParse({ ...valid, title: '' }).success).toBe(false);
  });

  it('rejects a missing frequencyConfig', () => {
    const { frequencyConfig: _f, ...rest } = valid;
    expect(createHabitSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects an invalid priority value', () => {
    expect(createHabitSchema.safeParse({ ...valid, priority: 'critical' }).success).toBe(false);
  });

  it('accepts a weekly frequencyConfig', () => {
    const r = createHabitSchema.safeParse({
      ...valid,
      frequencyConfig: { type: 'weekly', days: [1, 3, 5] },
    });
    expect(r.success).toBe(true);
  });

  it('rejects a weekly config without days', () => {
    expect(createHabitSchema.safeParse({
      ...valid,
      frequencyConfig: { type: 'weekly', days: [] },
    }).success).toBe(false);
  });

  it('rejects an invalid color format', () => {
    expect(createHabitSchema.safeParse({ ...valid, color: 'red' }).success).toBe(false);
  });

  it('accepts a valid hex color', () => {
    const r = createHabitSchema.safeParse({ ...valid, color: '#FF5733' });
    expect(r.success).toBe(true);
  });
});

describe('updateHabitSchema', () => {
  it('accepts an empty update (all fields optional)', () => {
    expect(updateHabitSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a partial update', () => {
    expect(updateHabitSchema.safeParse({ title: 'Run' }).success).toBe(true);
  });
});

describe('logHabitSchema', () => {
  const valid = { date: '2026-07-03', status: 'completed' as const };

  it('accepts a valid log entry', () => {
    expect(logHabitSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an invalid status', () => {
    expect(logHabitSchema.safeParse({ ...valid, status: 'pending' }).success).toBe(false);
  });

  it('rejects an invalid date format', () => {
    expect(logHabitSchema.safeParse({ ...valid, date: '2026/07/03' }).success).toBe(false);
  });

  it('accepts all valid status values', () => {
    for (const status of ['completed', 'skipped', 'failed'] as const) {
      expect(logHabitSchema.safeParse({ ...valid, status }).success).toBe(true);
    }
  });
});

describe('listHabitsQuerySchema', () => {
  it('defaults limit to 20', () => {
    const r = listHabitsQuerySchema.safeParse({});
    expect(r.success && r.data.limit).toBe(20);
  });

  it('coerces archived string to boolean', () => {
    const r = listHabitsQuerySchema.safeParse({ archived: 'true' });
    expect(r.success && r.data.archived).toBe(true);
  });

  it('rejects limit above 100', () => {
    expect(listHabitsQuerySchema.safeParse({ limit: '200' }).success).toBe(false);
  });
});

describe('habitLogsQuerySchema', () => {
  it('accepts valid from/to dates', () => {
    const r = habitLogsQuerySchema.safeParse({ from: '2026-01-01', to: '2026-07-03' });
    expect(r.success).toBe(true);
  });

  it('defaults limit to 30', () => {
    const r = habitLogsQuerySchema.safeParse({ from: '2026-01-01', to: '2026-07-03' });
    expect(r.success && r.data.limit).toBe(30);
  });

  it('rejects a missing from date', () => {
    expect(habitLogsQuerySchema.safeParse({ to: '2026-07-03' }).success).toBe(false);
  });
});

describe('createCategorySchema', () => {
  it('accepts a minimal valid category', () => {
    expect(createCategorySchema.safeParse({ name: 'Health' }).success).toBe(true);
  });

  it('rejects an empty name', () => {
    expect(createCategorySchema.safeParse({ name: '' }).success).toBe(false);
  });

  it('rejects an invalid color', () => {
    expect(createCategorySchema.safeParse({ name: 'Health', color: 'blue' }).success).toBe(false);
  });
});

// ── Recovery schemas ──────────────────────────────────────────────────────────

describe('createRecoveryGoalSchema', () => {
  const valid = { name: 'No alcohol' };

  it('accepts a minimal valid goal', () => {
    expect(createRecoveryGoalSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an empty name', () => {
    expect(createRecoveryGoalSchema.safeParse({ name: '' }).success).toBe(false);
  });

  it('accepts valid preset types', () => {
    for (const preset of ['no_smoking', 'no_alcohol', 'custom'] as const) {
      expect(createRecoveryGoalSchema.safeParse({ ...valid, presetType: preset }).success).toBe(true);
    }
  });

  it('rejects an unknown preset type', () => {
    expect(createRecoveryGoalSchema.safeParse({ ...valid, presetType: 'no_tv' }).success).toBe(false);
  });

  it('rejects an invalid color format', () => {
    expect(createRecoveryGoalSchema.safeParse({ ...valid, color: 'red' }).success).toBe(false);
  });
});

describe('updateRecoveryGoalSchema', () => {
  it('accepts an empty update', () => {
    expect(updateRecoveryGoalSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a partial update', () => {
    expect(updateRecoveryGoalSchema.safeParse({ name: 'New name' }).success).toBe(true);
  });
});

describe('logRelapseSchema', () => {
  it('accepts a minimal relapse log', () => {
    expect(logRelapseSchema.safeParse({}).success).toBe(true);
  });

  it('defaults triggers to empty array', () => {
    const r = logRelapseSchema.safeParse({});
    expect(r.success && r.data.triggers).toEqual([]);
  });

  it('rejects a moodBefore outside 1-10', () => {
    expect(logRelapseSchema.safeParse({ moodBefore: 0 }).success).toBe(false);
    expect(logRelapseSchema.safeParse({ moodBefore: 11 }).success).toBe(false);
  });

  it('accepts a valid moodBefore', () => {
    expect(logRelapseSchema.safeParse({ moodBefore: 7 }).success).toBe(true);
  });

  it('rejects too many triggers', () => {
    const triggers = Array.from({ length: 11 }, (_, i) => `trigger${i}`);
    expect(logRelapseSchema.safeParse({ triggers }).success).toBe(false);
  });
});

// ── Goals schemas ─────────────────────────────────────────────────────────────

describe('createGoalSchema', () => {
  const valid = {
    title:    'Run a marathon',
    category: 'fitness' as const,
    goalType: 'long_term' as const,
  };

  it('accepts a minimal valid goal', () => {
    expect(createGoalSchema.safeParse(valid).success).toBe(true);
  });

  it('defaults progressType to percentage', () => {
    const r = createGoalSchema.safeParse(valid);
    expect(r.success && r.data.progressType).toBe('percentage');
  });

  it('defaults priority to medium', () => {
    const r = createGoalSchema.safeParse(valid);
    expect(r.success && r.data.priority).toBe('medium');
  });

  it('defaults habitIds to empty array', () => {
    const r = createGoalSchema.safeParse(valid);
    expect(r.success && r.data.habitIds).toEqual([]);
  });

  it('defaults milestones to empty array', () => {
    const r = createGoalSchema.safeParse(valid);
    expect(r.success && r.data.milestones).toEqual([]);
  });

  it('rejects an empty title', () => {
    expect(createGoalSchema.safeParse({ ...valid, title: '' }).success).toBe(false);
  });

  it('rejects a title exceeding 300 chars', () => {
    expect(createGoalSchema.safeParse({ ...valid, title: 'a'.repeat(301) }).success).toBe(false);
  });

  it('rejects an invalid category', () => {
    expect(createGoalSchema.safeParse({ ...valid, category: 'hobby' }).success).toBe(false);
  });

  it('rejects an invalid goalType', () => {
    expect(createGoalSchema.safeParse({ ...valid, goalType: 'immediate' }).success).toBe(false);
  });

  it('accepts all valid category values', () => {
    const cats = ['health','fitness','career','finance','relationships','learning','mental_health','self_care','other'] as const;
    for (const category of cats) {
      expect(createGoalSchema.safeParse({ ...valid, category }).success).toBe(true);
    }
  });

  it('accepts all valid goalType values', () => {
    for (const goalType of ['short_term','medium_term','long_term'] as const) {
      expect(createGoalSchema.safeParse({ ...valid, goalType }).success).toBe(true);
    }
  });

  it('accepts a positive targetValue', () => {
    expect(createGoalSchema.safeParse({ ...valid, targetValue: 42.5 }).success).toBe(true);
  });

  it('rejects a zero targetValue', () => {
    expect(createGoalSchema.safeParse({ ...valid, targetValue: 0 }).success).toBe(false);
  });

  it('rejects habitIds exceeding 20 entries', () => {
    const habitIds = Array.from({ length: 21 }, () => '00000000-0000-0000-0000-000000000000');
    expect(createGoalSchema.safeParse({ ...valid, habitIds }).success).toBe(false);
  });

  it('rejects invalid UUID in habitIds', () => {
    expect(createGoalSchema.safeParse({ ...valid, habitIds: ['not-a-uuid'] }).success).toBe(false);
  });

  it('accepts a valid targetDate', () => {
    expect(createGoalSchema.safeParse({ ...valid, targetDate: '2026-12-31' }).success).toBe(true);
  });

  it('rejects an invalid targetDate', () => {
    expect(createGoalSchema.safeParse({ ...valid, targetDate: '31/12/2026' }).success).toBe(false);
  });

  it('accepts milestones with nested title', () => {
    const r = createGoalSchema.safeParse({
      ...valid,
      milestones: [{ title: 'Phase 1' }],
    });
    expect(r.success).toBe(true);
  });

  it('rejects milestones exceeding 20 entries', () => {
    const milestones = Array.from({ length: 21 }, (_, i) => ({ title: `M${i}` }));
    expect(createGoalSchema.safeParse({ ...valid, milestones }).success).toBe(false);
  });

  it('rejects a milestone with an empty title', () => {
    expect(createGoalSchema.safeParse({ ...valid, milestones: [{ title: '' }] }).success).toBe(false);
  });
});

describe('updateGoalSchema', () => {
  it('accepts an empty update (all fields optional)', () => {
    expect(updateGoalSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a partial title update', () => {
    expect(updateGoalSchema.safeParse({ title: 'New goal title' }).success).toBe(true);
  });

  it('rejects an invalid progressType value', () => {
    expect(updateGoalSchema.safeParse({ progressType: 'visual' }).success).toBe(false);
  });

  it('accepts valid priority values', () => {
    for (const priority of ['low', 'medium', 'high'] as const) {
      expect(updateGoalSchema.safeParse({ priority }).success).toBe(true);
    }
  });
});

describe('updateGoalProgressSchema', () => {
  it('accepts all fields omitted', () => {
    expect(updateGoalProgressSchema.safeParse({}).success).toBe(true);
  });

  it('accepts progressPct between 0 and 100', () => {
    expect(updateGoalProgressSchema.safeParse({ progressPct: 50 }).success).toBe(true);
    expect(updateGoalProgressSchema.safeParse({ progressPct: 0 }).success).toBe(true);
    expect(updateGoalProgressSchema.safeParse({ progressPct: 100 }).success).toBe(true);
  });

  it('rejects progressPct above 100', () => {
    expect(updateGoalProgressSchema.safeParse({ progressPct: 101 }).success).toBe(false);
  });

  it('rejects progressPct below 0', () => {
    expect(updateGoalProgressSchema.safeParse({ progressPct: -1 }).success).toBe(false);
  });

  it('accepts a non-negative currentValue', () => {
    expect(updateGoalProgressSchema.safeParse({ currentValue: 0 }).success).toBe(true);
    expect(updateGoalProgressSchema.safeParse({ currentValue: 10.5 }).success).toBe(true);
  });
});

describe('createMilestoneSchema', () => {
  it('accepts a minimal milestone', () => {
    expect(createMilestoneSchema.safeParse({ title: 'First 5k' }).success).toBe(true);
  });

  it('rejects an empty title', () => {
    expect(createMilestoneSchema.safeParse({ title: '' }).success).toBe(false);
  });

  it('rejects a title over 300 chars', () => {
    expect(createMilestoneSchema.safeParse({ title: 'x'.repeat(301) }).success).toBe(false);
  });

  it('accepts an optional targetDate', () => {
    expect(createMilestoneSchema.safeParse({ title: 'Step 1', targetDate: '2026-09-01' }).success).toBe(true);
  });

  it('rejects an invalid targetDate', () => {
    expect(createMilestoneSchema.safeParse({ title: 'Step 1', targetDate: 'tomorrow' }).success).toBe(false);
  });

  it('rejects notes over 500 chars', () => {
    expect(createMilestoneSchema.safeParse({ title: 'Step 1', notes: 'n'.repeat(501) }).success).toBe(false);
  });

  it('rejects a negative sortOrder', () => {
    expect(createMilestoneSchema.safeParse({ title: 'Step 1', sortOrder: -1 }).success).toBe(false);
  });
});

describe('listGoalsQuerySchema', () => {
  it('accepts an empty query (all defaults)', () => {
    const r = listGoalsQuerySchema.safeParse({});
    expect(r.success).toBe(true);
    expect(r.success && r.data.limit).toBe(20);
    expect(r.success && r.data.sort).toBe('createdAt');
    expect(r.success && r.data.order).toBe('desc');
  });

  it('accepts valid status filter', () => {
    for (const status of ['active','completed','abandoned'] as const) {
      expect(listGoalsQuerySchema.safeParse({ status }).success).toBe(true);
    }
  });

  it('rejects an invalid status', () => {
    expect(listGoalsQuerySchema.safeParse({ status: 'draft' }).success).toBe(false);
  });

  it('rejects limit above 50', () => {
    expect(listGoalsQuerySchema.safeParse({ limit: '51' }).success).toBe(false);
  });

  it('coerces a numeric string limit', () => {
    const r = listGoalsQuerySchema.safeParse({ limit: '10' });
    expect(r.success && r.data.limit).toBe(10);
  });
});

// ── Planner schemas ───────────────────────────────────────────────────────────

describe('createTaskSchema', () => {
  const valid = {
    planDate:  '2026-07-03',
    timeBlock: 'morning' as const,
    title:     'Review PRs',
  };

  it('accepts a minimal valid task', () => {
    expect(createTaskSchema.safeParse(valid).success).toBe(true);
  });

  it('defaults priority to 2', () => {
    const r = createTaskSchema.safeParse(valid);
    expect(r.success && r.data.priority).toBe(2);
  });

  it('defaults sortOrder to 0', () => {
    const r = createTaskSchema.safeParse(valid);
    expect(r.success && r.data.sortOrder).toBe(0);
  });

  it('rejects an empty title', () => {
    expect(createTaskSchema.safeParse({ ...valid, title: '' }).success).toBe(false);
  });

  it('rejects a title exceeding 500 chars', () => {
    expect(createTaskSchema.safeParse({ ...valid, title: 't'.repeat(501) }).success).toBe(false);
  });

  it('rejects an invalid planDate format', () => {
    expect(createTaskSchema.safeParse({ ...valid, planDate: '03-07-2026' }).success).toBe(false);
  });

  it('rejects an invalid timeBlock', () => {
    expect(createTaskSchema.safeParse({ ...valid, timeBlock: 'midnight' }).success).toBe(false);
  });

  it('accepts all valid timeBlock values', () => {
    for (const timeBlock of ['morning','afternoon','evening','night'] as const) {
      expect(createTaskSchema.safeParse({ ...valid, timeBlock }).success).toBe(true);
    }
  });

  it('rejects priority outside 1-4', () => {
    expect(createTaskSchema.safeParse({ ...valid, priority: 0 }).success).toBe(false);
    expect(createTaskSchema.safeParse({ ...valid, priority: 5 }).success).toBe(false);
  });

  it('accepts all valid priority values', () => {
    for (const priority of [1, 2, 3, 4]) {
      expect(createTaskSchema.safeParse({ ...valid, priority }).success).toBe(true);
    }
  });

  it('rejects estimatedMin above 480', () => {
    expect(createTaskSchema.safeParse({ ...valid, estimatedMin: 481 }).success).toBe(false);
  });

  it('accepts a valid UUID goalId', () => {
    expect(createTaskSchema.safeParse({ ...valid, goalId: '00000000-0000-0000-0000-000000000000' }).success).toBe(true);
  });

  it('rejects a non-UUID goalId', () => {
    expect(createTaskSchema.safeParse({ ...valid, goalId: 'not-a-uuid' }).success).toBe(false);
  });
});

describe('updateTaskSchema', () => {
  it('accepts an empty update (all optional)', () => {
    expect(updateTaskSchema.safeParse({}).success).toBe(true);
  });

  it('accepts isCompleted true', () => {
    expect(updateTaskSchema.safeParse({ isCompleted: true }).success).toBe(true);
  });

  it('accepts a null goalId to unlink', () => {
    expect(updateTaskSchema.safeParse({ goalId: null }).success).toBe(true);
  });

  it('rejects actualMin above 480', () => {
    expect(updateTaskSchema.safeParse({ actualMin: 481 }).success).toBe(false);
  });

  it('accepts actualMin of 0', () => {
    expect(updateTaskSchema.safeParse({ actualMin: 0 }).success).toBe(true);
  });

  it('rejects a title update with empty string', () => {
    expect(updateTaskSchema.safeParse({ title: '' }).success).toBe(false);
  });
});

describe('carryOverSchema', () => {
  const validUuid = '00000000-0000-0000-0000-000000000001';
  const valid = {
    fromDate: '2026-07-01',
    toDate:   '2026-07-02',
    taskIds:  [validUuid],
  };

  it('accepts a valid carry-over', () => {
    expect(carryOverSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an empty taskIds array', () => {
    expect(carryOverSchema.safeParse({ ...valid, taskIds: [] }).success).toBe(false);
  });

  it('rejects taskIds exceeding 50 entries', () => {
    const taskIds = Array.from({ length: 51 }, () => validUuid);
    expect(carryOverSchema.safeParse({ ...valid, taskIds }).success).toBe(false);
  });

  it('rejects a non-UUID in taskIds', () => {
    expect(carryOverSchema.safeParse({ ...valid, taskIds: ['not-a-uuid'] }).success).toBe(false);
  });

  it('rejects an invalid fromDate', () => {
    expect(carryOverSchema.safeParse({ ...valid, fromDate: 'yesterday' }).success).toBe(false);
  });
});

// ── Users schemas ─────────────────────────────────────────────────────────────

describe('updateProfileSchema', () => {
  it('accepts an empty update (all optional)', () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a valid partial profile update', () => {
    expect(updateProfileSchema.safeParse({ firstName: 'Bob', timezone: 'America/New_York' }).success).toBe(true);
  });

  it('rejects an empty firstName', () => {
    expect(updateProfileSchema.safeParse({ firstName: '' }).success).toBe(false);
  });

  it('rejects a firstName over 100 chars', () => {
    expect(updateProfileSchema.safeParse({ firstName: 'a'.repeat(101) }).success).toBe(false);
  });

  it('rejects a username with invalid characters', () => {
    expect(updateProfileSchema.safeParse({ username: 'user name!' }).success).toBe(false);
  });

  it('accepts a username with allowed characters', () => {
    expect(updateProfileSchema.safeParse({ username: 'user_name-123' }).success).toBe(true);
  });

  it('rejects a username shorter than 3 chars', () => {
    expect(updateProfileSchema.safeParse({ username: 'ab' }).success).toBe(false);
  });

  it('accepts valid theme values', () => {
    for (const theme of ['light', 'dark', 'system'] as const) {
      expect(updateProfileSchema.safeParse({ theme }).success).toBe(true);
    }
  });

  it('rejects an invalid theme value', () => {
    expect(updateProfileSchema.safeParse({ theme: 'auto' }).success).toBe(false);
  });

  it('accepts a valid birthday date', () => {
    expect(updateProfileSchema.safeParse({ birthday: '1990-06-15' }).success).toBe(true);
  });

  it('rejects an invalid birthday format', () => {
    expect(updateProfileSchema.safeParse({ birthday: '15/06/1990' }).success).toBe(false);
  });

  it('rejects a bio over 500 chars', () => {
    expect(updateProfileSchema.safeParse({ bio: 'b'.repeat(501) }).success).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  const valid = {
    currentPassword: 'OldPassword1',
    newPassword:     'NewPass1!Safe',
  };

  it('accepts valid current and new password', () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a missing currentPassword', () => {
    const { currentPassword: _c, ...rest } = valid;
    expect(changePasswordSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects a new password shorter than 8 chars', () => {
    expect(changePasswordSchema.safeParse({ ...valid, newPassword: 'Ab1' }).success).toBe(false);
  });

  it('rejects a new password without an uppercase letter', () => {
    expect(changePasswordSchema.safeParse({ ...valid, newPassword: 'password1!' }).success).toBe(false);
  });

  it('rejects a new password without a lowercase letter', () => {
    expect(changePasswordSchema.safeParse({ ...valid, newPassword: 'PASSWORD1!' }).success).toBe(false);
  });

  it('rejects a new password without a number', () => {
    expect(changePasswordSchema.safeParse({ ...valid, newPassword: 'PasswordOnly!' }).success).toBe(false);
  });

  it('rejects a new password exceeding 128 chars', () => {
    expect(changePasswordSchema.safeParse({ ...valid, newPassword: 'Aa1' + 'x'.repeat(126) }).success).toBe(false);
  });
});

// ── Journal schemas ───────────────────────────────────────────────────────────

describe('createJournalEntrySchema', () => {
  const validMorning = {
    entryDate: '2026-07-03',
    entryType: 'morning' as const,
  };

  it('accepts a minimal morning entry', () => {
    expect(createJournalEntrySchema.safeParse(validMorning).success).toBe(true);
  });

  it('defaults tags to empty array', () => {
    const r = createJournalEntrySchema.safeParse(validMorning);
    expect(r.success && r.data.tags).toEqual([]);
  });

  it('defaults isDraft to false', () => {
    const r = createJournalEntrySchema.safeParse(validMorning);
    expect(r.success && r.data.isDraft).toBe(false);
  });

  it('accepts isDraft: true', () => {
    const r = createJournalEntrySchema.safeParse({ ...validMorning, isDraft: true });
    expect(r.success && r.data.isDraft).toBe(true);
  });

  it('rejects a missing entryDate', () => {
    const { entryDate: _d, ...rest } = validMorning;
    expect(createJournalEntrySchema.safeParse(rest).success).toBe(false);
  });

  it('rejects an invalid entryDate format', () => {
    expect(createJournalEntrySchema.safeParse({ ...validMorning, entryDate: '03-07-2026' }).success).toBe(false);
  });

  it('rejects an invalid entryType', () => {
    expect(createJournalEntrySchema.safeParse({ ...validMorning, entryType: 'afternoon' }).success).toBe(false);
  });

  it('accepts all valid entryType values', () => {
    for (const entryType of ['morning', 'evening', 'free_write'] as const) {
      expect(createJournalEntrySchema.safeParse({ ...validMorning, entryType }).success).toBe(true);
    }
  });

  it('rejects moodMorning outside 1-10', () => {
    expect(createJournalEntrySchema.safeParse({ ...validMorning, moodMorning: 0 }).success).toBe(false);
    expect(createJournalEntrySchema.safeParse({ ...validMorning, moodMorning: 11 }).success).toBe(false);
  });

  it('accepts valid moodMorning range', () => {
    expect(createJournalEntrySchema.safeParse({ ...validMorning, moodMorning: 1 }).success).toBe(true);
    expect(createJournalEntrySchema.safeParse({ ...validMorning, moodMorning: 10 }).success).toBe(true);
  });

  it('rejects sleepHours above 24', () => {
    expect(createJournalEntrySchema.safeParse({ ...validMorning, sleepHours: 25 }).success).toBe(false);
  });

  it('accepts sleepHours at boundary values', () => {
    expect(createJournalEntrySchema.safeParse({ ...validMorning, sleepHours: 0 }).success).toBe(true);
    expect(createJournalEntrySchema.safeParse({ ...validMorning, sleepHours: 24 }).success).toBe(true);
  });

  it('rejects gratitude exceeding 10 entries', () => {
    const gratitude = Array.from({ length: 11 }, (_, i) => `item ${i}`);
    expect(createJournalEntrySchema.safeParse({ ...validMorning, gratitude }).success).toBe(false);
  });

  it('rejects tags exceeding 20 entries', () => {
    const tags = Array.from({ length: 21 }, (_, i) => `tag${i}`);
    expect(createJournalEntrySchema.safeParse({ ...validMorning, tags }).success).toBe(false);
  });

  it('rejects a tag over 50 chars', () => {
    expect(createJournalEntrySchema.safeParse({ ...validMorning, tags: ['t'.repeat(51)] }).success).toBe(false);
  });

  it('rejects content exceeding 50000 chars', () => {
    expect(createJournalEntrySchema.safeParse({ ...validMorning, content: 'x'.repeat(50001) }).success).toBe(false);
  });

  it('rejects dayRating outside 1-5', () => {
    expect(createJournalEntrySchema.safeParse({ ...validMorning, dayRating: 0 }).success).toBe(false);
    expect(createJournalEntrySchema.safeParse({ ...validMorning, dayRating: 6 }).success).toBe(false);
  });
});

describe('listJournalQuerySchema', () => {
  it('accepts an empty query (all defaults)', () => {
    const r = listJournalQuerySchema.safeParse({});
    expect(r.success).toBe(true);
    expect(r.success && r.data.limit).toBe(20);
  });

  it('accepts optional type filter', () => {
    for (const type of ['morning', 'evening', 'free_write'] as const) {
      expect(listJournalQuerySchema.safeParse({ type }).success).toBe(true);
    }
  });

  it('rejects an invalid type', () => {
    expect(listJournalQuerySchema.safeParse({ type: 'afternoon' }).success).toBe(false);
  });

  it('accepts from and to date filters', () => {
    const r = listJournalQuerySchema.safeParse({ from: '2026-01-01', to: '2026-07-03' });
    expect(r.success).toBe(true);
  });

  it('rejects limit above 50', () => {
    expect(listJournalQuerySchema.safeParse({ limit: '51' }).success).toBe(false);
  });

  it('coerces a string limit to number', () => {
    const r = listJournalQuerySchema.safeParse({ limit: '10' });
    expect(r.success && r.data.limit).toBe(10);
  });

  it('rejects limit below 1', () => {
    expect(listJournalQuerySchema.safeParse({ limit: '0' }).success).toBe(false);
  });
});
