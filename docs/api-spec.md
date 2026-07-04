# Habito API Specification — v1
Base URL: `/api/v1`  
Auth: `Authorization: Bearer <accessToken>` on all protected routes  
Refresh token: `habito_refresh` httpOnly cookie (path `/api/v1/auth`)

## Response Envelope
```jsonc
// Success
{ "success": true, "data": { ... }, "meta": { "pagination": { ... } } }

// Error
{ "success": false, "error": { "code": "ERROR_CODE", "message": "...", "details": [...] }, "requestId": "uuid" }
```

---

## AUTH `/auth`

| Method | Path | Auth | Body Schema | Response | Rate |
|--------|------|------|-------------|----------|------|
| POST | `/register` | ✗ | `registerSchema` | `201 { userId }` | 10/15min |
| POST | `/login` | ✗ | `loginSchema` | `200 LoginResponse` | 10/15min |
| POST | `/refresh` | cookie | — | `200 TokenRefreshResponse` | — |
| POST | `/logout` | ✓ | — | `200 { message }` | — |
| POST | `/logout-all` | ✓ | — | `200 { message }` | — |
| GET | `/verify-email/:token` | ✗ | — | `200 { message }` | 5/hr |
| POST | `/forgot-password` | ✗ | `forgotPasswordSchema` | `200 { message }` | 5/hr |
| POST | `/reset-password` | ✗ | `resetPasswordSchema` | `200 { message }` | 5/hr |

---

## USERS `/users`

| Method | Path | Auth | Body / Query | Response |
|--------|------|------|--------------|----------|
| GET | `/me` | ✓ | — | `200 UserProfile` |
| PATCH | `/me` | ✓ | `updateProfileSchema` | `200 UserProfile` |
| POST | `/me/avatar` | ✓ | `multipart/form-data file` | `200 { avatarUrl }` |
| DELETE | `/me/avatar` | ✓ | — | `200 { message }` |
| PATCH | `/me/password` | ✓ | `changePasswordSchema` | `200 { message }` |
| GET | `/me/settings` | ✓ | — | `200 UserSettings` |
| PATCH | `/me/settings` | ✓ | `updateSettingsSchema` | `200 UserSettings` |
| GET | `/me/sessions` | ✓ | — | `200 UserSession[]` |
| DELETE | `/me/sessions/:id` | ✓ | — | `204` |
| GET | `/me/export` | ✓ | — | `202 { message }` (async) |
| DELETE | `/me` | ✓ | `{ password }` | `200 { message }` (soft-delete + 30d) |

---

## HABITS `/habits`

| Method | Path | Auth | Body / Query | Response |
|--------|------|------|--------------|----------|
| GET | `/` | ✓ | `listHabitsQuerySchema` | `200 Habit[] + pagination` |
| POST | `/` | ✓ | `createHabitSchema` | `201 Habit` |
| GET | `/today` | ✓ | `?date=YYYY-MM-DD` | `200 HabitWithTodayLog[]` |
| GET | `/:id` | ✓ | — | `200 Habit` |
| PATCH | `/:id` | ✓ | `updateHabitSchema` | `200 Habit` |
| DELETE | `/:id` | ✓ | — | `204` |
| PATCH | `/:id/archive` | ✓ | `{ archive: bool }` | `200 Habit` |
| POST | `/:id/logs` | ✓ | `logHabitSchema` | `200 HabitLog` |
| GET | `/:id/logs` | ✓ | `habitLogsQuerySchema` | `200 HabitLog[] + pagination` |
| GET | `/:id/stats` | ✓ | `?period=week\|month\|year` | `200 HabitStats` |
| GET | `/categories` | ✓ | — | `200 HabitCategory[]` |
| POST | `/categories` | ✓ | `createCategorySchema` | `201 HabitCategory` |
| PATCH | `/categories/:id` | ✓ | `createCategorySchema.partial()` | `200 HabitCategory` |
| DELETE | `/categories/:id` | ✓ | — | `204` |

**Error codes:** `HABIT_NOT_FOUND`, `HABIT_LOG_EXISTS`, `HABIT_LIMIT_REACHED`

---

## RECOVERY `/recovery`

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| GET | `/` | ✓ | `?status=active\|paused\|completed` | `200 RecoveryGoal[]` |
| POST | `/` | ✓ | `createRecoveryGoalSchema` | `201 RecoveryGoal` |
| GET | `/:id` | ✓ | — | `200 RecoveryGoal` |
| PATCH | `/:id` | ✓ | `updateRecoveryGoalSchema` | `200 RecoveryGoal` |
| DELETE | `/:id` | ✓ | — | `204` |
| POST | `/:id/relapse` | ✓ | `logRelapseSchema` | `200 { goal: RecoveryGoal, log: RelapseLog }` |
| GET | `/:id/history` | ✓ | `?cursor&limit` | `200 RelapseLog[] + pagination` |

**Relapse response includes:** new streak (0), previous streak preserved in log.

---

## JOURNAL `/journal`

| Method | Path | Auth | Body / Query | Response |
|--------|------|------|--------------|----------|
| GET | `/` | ✓ | `listJournalQuerySchema` | `200 JournalEntry[] + pagination` |
| POST | `/` | ✓ | `createJournalEntrySchema` | `201 JournalEntry` |
| GET | `/date/:date` | ✓ | — | `200 { morning, evening, freeWrites }` |
| GET | `/:id` | ✓ | — | `200 JournalEntry` |
| PATCH | `/:id` | ✓ | `updateJournalEntrySchema` | `200 JournalEntry` |
| DELETE | `/:id` | ✓ | — | `204` |

**Constraint:** One `morning` + one `evening` per day per user. `409 JOURNAL_ENTRY_EXISTS` if violated.

---

## NOTES `/notes`

| Method | Path | Auth | Body / Query | Response |
|--------|------|------|--------------|----------|
| GET | `/` | ✓ | `listNotesQuerySchema` | `200 Note[] + pagination` |
| POST | `/` | ✓ | `createNoteSchema` | `201 Note` |
| GET | `/:id` | ✓ | — | `200 Note` |
| PATCH | `/:id` | ✓ | `updateNoteSchema` | `200 Note` |
| DELETE | `/:id` | ✓ | — | `204` |
| GET | `/folders` | ✓ | — | `200 NoteFolder[]` (tree) |
| POST | `/folders` | ✓ | `createFolderSchema` | `201 NoteFolder` |
| PATCH | `/folders/:id` | ✓ | `createFolderSchema.partial()` | `200 NoteFolder` |
| DELETE | `/folders/:id` | ✓ | — | `204` |
| GET | `/tags` | ✓ | — | `200 NoteTag[]` |
| POST | `/tags` | ✓ | `createTagSchema` | `201 NoteTag` |
| POST | `/:id/tags/:tagId` | ✓ | — | `200 Note` |
| DELETE | `/:id/tags/:tagId` | ✓ | — | `200 Note` |
| POST | `/:id/attachments` | ✓ | `multipart/form-data` | `201 Attachment` |
| DELETE | `/:id/attachments/:attachmentId` | ✓ | — | `204` |

---

## GYM `/gym`

| Method | Path | Auth | Body / Query | Response |
|--------|------|------|--------------|----------|
| GET | `/exercises` | ✓ | `listExercisesQuerySchema` | `200 Exercise[] + pagination` |
| POST | `/exercises` | ✓ | `createExerciseSchema` | `201 Exercise` |
| GET | `/exercises/:id` | ✓ | — | `200 Exercise` |
| GET | `/templates` | ✓ | `?cursor&limit&isFavorite` | `200 WorkoutTemplate[]` |
| POST | `/templates` | ✓ | `createTemplateSchema` | `201 WorkoutTemplate` |
| GET | `/templates/:id` | ✓ | — | `200 WorkoutTemplate` |
| PATCH | `/templates/:id` | ✓ | `createTemplateSchema.partial()` | `200 WorkoutTemplate` |
| DELETE | `/templates/:id` | ✓ | — | `204` |
| GET | `/sessions` | ✓ | `workoutHistoryQuerySchema` | `200 WorkoutSession[] + pagination` |
| POST | `/sessions/start` | ✓ | `startWorkoutSchema` | `201 WorkoutSession` |
| GET | `/sessions/active` | ✓ | — | `200 WorkoutSession \| null` |
| GET | `/sessions/:id` | ✓ | — | `200 WorkoutSession` |
| POST | `/sessions/:id/exercises` | ✓ | `addSessionExerciseSchema` | `201 SessionExercise` |
| POST | `/sessions/:id/exercises/:exId/sets` | ✓ | `logSetSchema` | `201 ExerciseSet` |
| PATCH | `/sessions/:id/exercises/:exId/sets/:setId` | ✓ | `logSetSchema.partial()` | `200 ExerciseSet` |
| DELETE | `/sessions/:id/exercises/:exId` | ✓ | — | `204` |
| POST | `/sessions/:id/finish` | ✓ | `finishWorkoutSchema` | `200 WorkoutSession` |
| DELETE | `/sessions/:id` | ✓ | — | `204` (discard) |
| GET | `/prs` | ✓ | `?exerciseId&prType` | `200 PersonalRecord[]` |
| GET | `/measurements` | ✓ | `?cursor&limit` | `200 BodyMeasurement[]` |
| POST | `/measurements` | ✓ | `createMeasurementSchema` | `201 BodyMeasurement` |
| GET | `/progress-photos` | ✓ | `?cursor&limit` | `200 ProgressPhoto[]` |
| POST | `/progress-photos` | ✓ | `multipart/form-data` | `201 ProgressPhoto` |

---

## GOALS `/goals`

| Method | Path | Auth | Body / Query | Response |
|--------|------|------|--------------|----------|
| GET | `/` | ✓ | `listGoalsQuerySchema` | `200 Goal[] + pagination` |
| POST | `/` | ✓ | `createGoalSchema` | `201 Goal` |
| GET | `/:id` | ✓ | — | `200 Goal` |
| PATCH | `/:id` | ✓ | `updateGoalSchema` | `200 Goal` |
| DELETE | `/:id` | ✓ | — | `204` |
| PATCH | `/:id/progress` | ✓ | `updateGoalProgressSchema` | `200 Goal` |
| POST | `/:id/complete` | ✓ | — | `200 Goal` |
| POST | `/:id/milestones` | ✓ | `createMilestoneSchema` | `201 GoalMilestone` |
| PATCH | `/:id/milestones/:mId` | ✓ | `createMilestoneSchema.partial()` | `200 GoalMilestone` |
| POST | `/:id/milestones/:mId/complete` | ✓ | — | `200 GoalMilestone` |
| DELETE | `/:id/milestones/:mId` | ✓ | — | `204` |
| POST | `/:id/habits/:habitId` | ✓ | — | `200 Goal` (link habit) |
| DELETE | `/:id/habits/:habitId` | ✓ | — | `200 Goal` (unlink) |

---

## PLANNER `/planner`

| Method | Path | Auth | Body / Query | Response |
|--------|------|------|--------------|----------|
| GET | `/:date` | ✓ | — | `200 DayPlan` |
| POST | `/` | ✓ | `createTaskSchema` | `201 PlannerTask` |
| PATCH | `/:id` | ✓ | `updateTaskSchema` | `200 PlannerTask` |
| DELETE | `/:id` | ✓ | — | `204` |
| POST | `/carry-over` | ✓ | `carryOverSchema` | `200 { created: number }` |
| PATCH | `/reorder` | ✓ | `reorderTasksSchema` | `200 { updated: number }` |

---

## CALENDAR `/calendar`

| Method | Path | Auth | Query | Response |
|--------|------|------|-------|----------|
| GET | `/:year/:month` | ✓ | `?layers=habits,gym,mood,journal,recovery,goals` | `200 CalendarDay[]` |
| GET | `/day/:date` | ✓ | — | `200 { ...CalendarDay, habits, workout, journal, tasks, notes }` |

**Layer query param** controls which data is loaded — unused layers excluded for performance.

---

## ANALYTICS `/analytics`

| Method | Path | Auth | Query | Response |
|--------|------|------|-------|----------|
| GET | `/overview` | ✓ | `analyticsQuerySchema` | `200 AnalyticsOverview` |
| GET | `/habits` | ✓ | `habitAnalyticsQuerySchema` | `200 HabitAnalytics` |
| GET | `/recovery` | ✓ | `analyticsQuerySchema` | `200 RecoveryAnalytics` |
| GET | `/fitness` | ✓ | `analyticsQuerySchema` | `200 FitnessAnalytics` |
| GET | `/mood` | ✓ | `analyticsQuerySchema` | `200 MoodAnalytics` |
| GET | `/goals` | ✓ | `analyticsQuerySchema` | `200 GoalAnalytics` |

**All analytics endpoints:** cached 5 minutes, vary by userId.

---

## LIFE BALANCE `/life-balance`

| Method | Path | Auth | Query | Response |
|--------|------|------|-------|----------|
| GET | `/current` | ✓ | — | `200 LifeBalanceScore` |
| GET | `/history` | ✓ | `?weeks=12` (default 12) | `200 LifeBalanceScore[]` |

---

## SEARCH `/search`

| Method | Path | Auth | Query | Response |
|--------|------|------|-------|----------|
| GET | `/` | ✓ | `searchQuerySchema` | `200 SearchResponse` |

**Query params:** `q` (required), `types` (comma-sep), `limit` per type (default 5).  
**Implementation:** PostgreSQL `plainto_tsquery`, ranked by `ts_rank_cd`. Response < 100ms target.

---

## NOTIFICATIONS `/notifications`

| Method | Path | Auth | Body / Query | Response |
|--------|------|------|--------------|----------|
| GET | `/` | ✓ | `listNotificationsQuerySchema` | `200 Notification[] + pagination` |
| GET | `/unread-count` | ✓ | — | `200 { count: number }` |
| PATCH | `/:id/read` | ✓ | — | `200 Notification` |
| PATCH | `/read-all` | ✓ | — | `200 { updated: number }` |
| DELETE | `/:id` | ✓ | — | `204` |
| POST | `/push/subscribe` | ✓ | `pushSubscriptionSchema` | `201 { message }` |
| DELETE | `/push/subscribe` | ✓ | — | `204` |

---

## ACHIEVEMENTS `/achievements`

| Method | Path | Auth | Query | Response |
|--------|------|------|-------|----------|
| GET | `/badges` | ✓ | — | `200 Badge[]` (all available) |
| GET | `/my-badges` | ✓ | — | `200 UserBadge[]` |
| GET | `/level` | ✓ | — | `200 UserLevel` |
| GET | `/xp-history` | ✓ | `?cursor&limit` | `200 XPTransaction[] + pagination` |

---

## DASHBOARD `/dashboard`

| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/` | ✓ | `200 DashboardData` |

**Cache:** 2 minutes, invalidated on habit log, journal write, or workout finish.

---

## ADMIN `/admin` — requires `admin` or `super_admin` role

| Method | Path | Role | Body / Query | Response |
|--------|------|------|--------------|----------|
| GET | `/dashboard` | admin | — | `200 AdminDashboard` |
| GET | `/users` | admin | `listUsersQuerySchema` | `200 User[] + pagination` |
| GET | `/users/:id` | admin | — | `200 UserProfile + activity` |
| PATCH | `/users/:id` | admin | `updateUserAdminSchema` | `200 UserProfile` |
| POST | `/users/:id/disable` | admin | `{ reason }` | `200 { message }` |
| POST | `/users/:id/enable` | admin | — | `200 { message }` |
| DELETE | `/users/:id` | admin | — | `200 { message }` (soft-delete) |
| POST | `/users/:id/restore` | admin | — | `200 { message }` |
| POST | `/users/:id/impersonate` | super_admin | `impersonateSchema` | `200 { accessToken, sessionId }` |
| DELETE | `/impersonate` | super_admin | — | `204` (end session) |
| GET | `/audit-logs` | admin | `listAuditLogsQuerySchema` | `200 AuditLog[] + pagination` |
| GET | `/error-logs` | admin | `?page&limit&statusCode` | `200 ErrorLog[] + pagination` |
| GET | `/feedback` | moderator | `?status&page&limit` | `200 UserFeedback[] + pagination` |
| PATCH | `/feedback/:id` | moderator | `updateFeedbackSchema` | `200 UserFeedback` |
| GET | `/feature-flags` | admin | — | `200 FeatureFlag[]` |
| PATCH | `/feature-flags/:key` | super_admin | `updateFeatureFlagSchema` | `200 FeatureFlag` |
| GET | `/global-settings` | admin | — | `200 GlobalSetting[]` |
| PATCH | `/global-settings/:key` | super_admin | `updateGlobalSettingSchema` | `200 GlobalSetting` |
| GET | `/reports/users` | admin | `?from&to&format=json\|csv` | `200 data \| CSV file` |
| GET | `/reports/activity` | admin | `?from&to&format=json\|csv` | `200 data \| CSV file` |

---

## Standard Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | Zod validation failed — `details` contains field errors |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `TOKEN_EXPIRED` | 401 | Access token expired — client should refresh |
| `TOKEN_INVALID` | 401 | Token is malformed or tampered |
| `TOKEN_REUSE_DETECTED` | 401 | Refresh token used twice — entire family revoked |
| `EMAIL_NOT_VERIFIED` | 403 | Must verify email before login |
| `ACCOUNT_DISABLED` | 403 | Account disabled by admin |
| `FORBIDDEN` | 403 | Authenticated but lacks permission |
| `NOT_FOUND` | 404 | Resource does not exist or not owned by user |
| `CONFLICT` | 409 | Resource already exists (email, username, duplicate log) |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error — never exposes details in production |

---

## Pagination Contract

### Cursor-based (default for all list endpoints)
```
GET /habits?cursor=uuid&limit=20
→ { data: [...], meta: { pagination: { nextCursor, prevCursor, hasNextPage, hasPrevPage } } }
```
- `cursor` = id of last item from previous page
- `limit` default 20, max 100

### Offset-based (admin endpoints only)
```
GET /admin/users?page=2&limit=20
→ { data: [...], meta: { pagination: { page, limit, total, totalPages } } }
```

---

## Idempotency

Endpoints safe to retry without side effects:
- `POST /habits/:id/logs` — upserts on `(habitId, logDate)` unique constraint
- `POST /notifications/push/subscribe` — upserts on `endpoint` unique constraint
- `GET` all read endpoints — naturally idempotent

Endpoints that are NOT idempotent (use with care):
- `POST /gym/sessions/start` — creates a new session each call
- `POST /recovery/:id/relapse` — creates a new relapse log each call

---

## API Versioning

Current: `v1`. Future versions introduced as `/api/v2` with parallel support period of 6 months. Breaking changes are never made within a version.
