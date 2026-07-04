// =============================================================================
// Shared API Response Types — consumed by both frontend and backend
// =============================================================================

// ── Envelope ─────────────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string; details?: FieldError[] };
  requestId?: string;
}

export interface FieldError {
  field: string;
  message: string;
  code: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PaginationMeta {
  nextCursor:  string | null;
  prevCursor:  string | null;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  total?:      number;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id:            string;
  email:         string;
  firstName:     string;
  lastName:      string | null;
  username:      string;
  avatarUrl:     string | null;
  emailVerified: boolean;
  roles:         string[];
}

export interface LoginResponse {
  accessToken: string;
  expiresIn:   number;
  user:        AuthUser;
}

export interface TokenRefreshResponse {
  accessToken: string;
  expiresIn:   number;
}

// ── User Profile ─────────────────────────────────────────────────────────────

export interface UserProfile {
  id:        string;
  email:     string;
  username:  string;
  firstName: string;
  lastName:  string | null;
  avatarUrl: string | null;
  bio:       string | null;
  birthday:  string | null;
  timezone:  string;
  theme:     'light' | 'dark' | 'system';
  level:     number;
  totalXp:   number;
  createdAt: string;
}

export interface UserSession {
  id:         string;
  deviceName: string | null;
  userAgent:  string | null;
  ipAddress:  string | null;
  lastActive: string;
  isCurrent:  boolean;
}

// ── Habits ───────────────────────────────────────────────────────────────────

export interface HabitCategory {
  id:        string;
  name:      string;
  color:     string | null;
  icon:      string | null;
  isGlobal:  boolean;
  sortOrder: number;
}

export interface Habit {
  id:               string;
  title:            string;
  description:      string | null;
  categoryId:       string | null;
  category:         HabitCategory | null;
  icon:             string | null;
  color:            string | null;
  frequencyType:    string;
  frequencyConfig:  Record<string, unknown>;
  priority:         'low' | 'medium' | 'high';
  reminderEnabled:  boolean;
  reminderConfig:   Record<string, unknown>;
  startDate:        string;
  endDate:          string | null;
  isArchived:       boolean;
  currentStreak:    number;
  longestStreak:    number;
  totalCompletions: number;
  successRate:      number;
  lastCompletedDate: string | null;
  createdAt:        string;
}

export interface HabitWithTodayLog extends Habit {
  todayLog: HabitLog | null;
}

export interface HabitLog {
  id:         string;
  habitId:    string;
  logDate:    string;
  status:     'completed' | 'skipped' | 'failed';
  value:      number | null;
  note:       string | null;
  skipReason: string | null;
  loggedAt:   string;
}

export interface HabitStats {
  habitId:         string;
  title:           string;
  currentStreak:   number;
  longestStreak:   number;
  totalCompletions: number;
  successRate:     number;
  heatmap:         HeatmapDay[];
  byDayOfWeek:     { day: number; count: number; rate: number }[];
  trend:           { date: string; completed: boolean; value: number | null }[];
}

export interface HeatmapDay {
  date:   string;
  status: 'completed' | 'skipped' | 'failed' | null;
  value:  number | null;
}

// ── Recovery ─────────────────────────────────────────────────────────────────

export interface RecoveryGoal {
  id:               string;
  name:             string;
  presetType:       string | null;
  icon:             string | null;
  color:            string | null;
  personalWhy:      string | null;
  emergencyPlan:    string | null;
  startDate:        string;
  status:           'active' | 'paused' | 'completed';
  currentStreakDays: number;
  longestStreakDays: number;
  totalRelapses:    number;
  sobrietyClock:    { days: number; hours: number; minutes: number };
  createdAt:        string;
}

export interface RelapseLog {
  id:           string;
  relapsedAt:   string;
  moodBefore:   number | null;
  triggers:     string[];
  location:     string | null;
  notes:        string | null;
  planForNext:  string | null;
  streakBroken: number;
}

// ── Journal ──────────────────────────────────────────────────────────────────

export interface JournalEntry {
  id:           string;
  entryDate:    string;
  entryType:    'morning' | 'evening' | 'free_write';
  moodMorning:  number | null;
  moodEvening:  number | null;
  energyLevel:  number | null;
  sleepQuality: number | null;
  sleepHours:   number | null;
  stressLevel:  number | null;
  dayRating:    number | null;
  gratitude:    string[];
  wins:         string[];
  lessons:      string | null;
  intention:    string | null;
  wordOfDay:    string | null;
  tomorrowPrio: string | null;
  content:      string | null;
  tags:         string[];
  isDraft:      boolean;
  createdAt:    string;
  updatedAt:    string;
}

// ── Notes ────────────────────────────────────────────────────────────────────

export interface NoteFolder {
  id:        string;
  name:      string;
  parentId:  string | null;
  color:     string | null;
  icon:      string | null;
  sortOrder: number;
  children?: NoteFolder[];
}

export interface NoteTag {
  id:         string;
  name:       string;
  color:      string | null;
  usageCount: number;
}

export interface Note {
  id:          string;
  title:       string;
  content:     string | null;
  noteType:    string;
  folderId:    string | null;
  folder:      NoteFolder | null;
  tags:        NoteTag[];
  isPinned:    boolean;
  isFavorite:  boolean;
  isArchived:  boolean;
  wordCount:   number;
  createdAt:   string;
  updatedAt:   string;
}

// ── Gym ──────────────────────────────────────────────────────────────────────

export interface Exercise {
  id:               string;
  name:             string;
  description:      string | null;
  category:         string;
  equipment:        string;
  primaryMuscles:   string[];
  secondaryMuscles: string[];
  isGlobal:         boolean;
  imageUrl:         string | null;
  videoUrl:         string | null;
}

export interface WorkoutTemplate {
  id:                   string;
  name:                 string;
  description:          string | null;
  estimatedDurationMin: number | null;
  category:             string | null;
  isFavorite:           boolean;
  timesUsed:            number;
  exercises:            TemplateExercise[];
}

export interface TemplateExercise {
  id:           string;
  exercise:     Exercise;
  sortOrder:    number;
  targetSets:   number | null;
  targetReps:   string | null;
  targetWeight: number | null;
  restSeconds:  number;
}

export interface WorkoutSession {
  id:             string;
  name:           string | null;
  templateId:     string | null;
  startedAt:      string;
  finishedAt:     string | null;
  durationSeconds: number | null;
  totalVolumeKg:  number | null;
  effortRating:   number | null;
  status:         'in_progress' | 'completed' | 'discarded';
  exercises:      SessionExercise[];
}

export interface SessionExercise {
  id:       string;
  exercise: Exercise;
  sortOrder: number;
  sets:     ExerciseSet[];
}

export interface ExerciseSet {
  id:              string;
  setNumber:       number;
  setType:         string;
  weightKg:        number | null;
  reps:            number | null;
  durationSeconds: number | null;
  rpe:             number | null;
  isCompleted:     boolean;
}

export interface PersonalRecord {
  id:         string;
  exerciseId: string;
  exercise:   Exercise;
  prType:     string;
  value:      number;
  achievedAt: string;
}

export interface BodyMeasurement {
  id:          string;
  measuredAt:  string;
  weightKg:    number | null;
  bodyFatPct:  number | null;
  chestCm:     number | null;
  waistCm:     number | null;
  hipsCm:      number | null;
  bicepCm:     number | null;
  thighCm:     number | null;
}

// ── Goals ────────────────────────────────────────────────────────────────────

export interface Goal {
  id:           string;
  title:        string;
  description:  string | null;
  category:     string;
  goalType:     string;
  progressType: string;
  targetValue:  number | null;
  currentValue: number;
  unit:         string | null;
  progressPct:  number;
  priority:     string;
  targetDate:   string | null;
  status:       'active' | 'completed' | 'abandoned';
  completedAt:  string | null;
  milestones:   GoalMilestone[];
  linkedHabits: { id: string; title: string }[];
  daysRemaining: number | null;
  isOverdue:    boolean;
  createdAt:    string;
}

export interface GoalMilestone {
  id:          string;
  title:       string;
  targetValue: number | null;
  targetDate:  string | null;
  isCompleted: boolean;
  completedAt: string | null;
  sortOrder:   number;
}

// ── Planner ──────────────────────────────────────────────────────────────────

export interface PlannerTask {
  id:           string;
  planDate:     string;
  timeBlock:    'morning' | 'afternoon' | 'evening' | 'night';
  title:        string;
  notes:        string | null;
  priority:     number;
  estimatedMin: number | null;
  actualMin:    number | null;
  sortOrder:    number;
  isCompleted:  boolean;
  completedAt:  string | null;
  carriedOver:  boolean;
  goalId:       string | null;
  goal:         { id: string; title: string } | null;
}

export interface DayPlan {
  date:      string;
  morning:   PlannerTask[];
  afternoon: PlannerTask[];
  evening:   PlannerTask[];
  night:     PlannerTask[];
  totalTasks:     number;
  completedTasks: number;
  completionPct:  number;
}

// ── Calendar ─────────────────────────────────────────────────────────────────

export interface CalendarDay {
  date:               string;
  habitsCompleted:    number;
  habitsScheduled:    number;
  habitCompletionPct: number;
  workoutCount:       number;
  moodMorning:        number | null;
  moodEvening:        number | null;
  journalWritten:     boolean;
  recoveryDays:       number;
  notesCreated:       number;
}

// ── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsOverview {
  period:             string;
  from:               string;
  to:                 string;
  consistencyScore:   number;
  habitsCompletionAvg: number;
  moodAvg:            number | null;
  totalWorkouts:      number;
  totalVolumeKg:      number;
  journalStreak:      number;
  xpEarned:           number;
  topHabits:          { id: string; title: string; rate: number }[];
  moodTrend:          { date: string; morning: number | null; evening: number | null }[];
  habitHeatmap:       HeatmapDay[];
}

// ── Life Balance ──────────────────────────────────────────────────────────────

export interface LifeBalanceScore {
  weekStart:         string;
  health:            number;
  fitness:           number;
  career:            number;
  finance:           number;
  relationships:     number;
  learning:          number;
  mentalHealth:      number;
  selfCare:          number;
  overall:           number;
}

// ── Search ───────────────────────────────────────────────────────────────────

export interface SearchResult {
  type:    'habit' | 'note' | 'journal' | 'goal' | 'workout' | 'recovery';
  id:      string;
  title:   string;
  snippet: string;
  date:    string | null;
  url:     string;
}

export interface SearchResponse {
  query:   string;
  total:   number;
  results: SearchResult[];
  byType:  Record<string, SearchResult[]>;
}

// ── Notifications ────────────────────────────────────────────────────────────

export interface Notification {
  id:          string;
  type:        string;
  title:       string;
  body:        string | null;
  deepLink:    string | null;
  isRead:      boolean;
  readAt:      string | null;
  entityType:  string | null;
  entityId:    string | null;
  createdAt:   string;
}

// ── Achievements ──────────────────────────────────────────────────────────────

export interface Badge {
  id:          string;
  slug:        string;
  name:        string;
  description: string | null;
  icon:        string | null;
  category:    string;
  xpReward:    number;
}

export interface UserBadge extends Badge {
  earnedAt: string;
}

export interface UserLevel {
  level:        number;
  totalXp:      number;
  xpToNextLevel: number;
  progressPct:  number;
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardData {
  greeting:        string;
  quote:           { text: string; author: string };
  todayScore:      number;
  lifeBalance:     LifeBalanceScore;
  activeStreaks:   { habitId: string; title: string; streak: number; color: string | null }[];
  todayHabits:     HabitWithTodayLog[];
  todayPlan:       DayPlan;
  recentWorkout:   WorkoutSession | null;
  journalToday:    { morning: boolean; evening: boolean };
  recoveryGoals:   RecoveryGoal[];
  weeklyProgress:  { date: string; score: number }[];
  level:           UserLevel;
  recentNotes:     Note[];
}
