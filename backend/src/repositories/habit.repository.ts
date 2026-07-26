import { PrismaClient, Habit, HabitLog, Prisma, HabitLogStatus, $Enums } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class HabitRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  async findById(id: string, userId: string): Promise<Habit | null> {
    return this.db.habit.findFirst({
      where: { id, userId, deletedAt: null },
    });
  }

  async findAll(userId: string, params: {
    isArchived?: boolean;
    categoryId?: string;
    habitType?: $Enums.HabitType;
    cursor?: string;
    limit: number;
  }) {
    return this.db.habit.findMany({
      where: {
        userId,
        deletedAt: null,
        isArchived: params.isArchived ?? false,
        ...(params.categoryId ? { categoryId: params.categoryId } : {}),
        ...(params.habitType  ? { habitType:  params.habitType }  : {}),
      },
      take: params.limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      orderBy: [{ isArchived: 'asc' }, { createdAt: 'desc' }],
      select: {
        id:               true,
        title:            true,
        description:      true,
        icon:             true,
        color:            true,
        habitType:        true,
        frequencyType:    true,
        frequencyConfig:  true,
        priority:         true,
        isArchived:       true,
        currentStreak:    true,
        longestStreak:    true,
        totalCompletions: true,
        lastCompletedDate: true,
        startDate:        true,
        categoryId:       true,
        createdAt:        true,
        category:         true,
        customFields:     true,
      },
    });
  }

  async create(data: Prisma.HabitCreateInput): Promise<Habit> {
    return this.db.habit.create({ data });
  }

  async update(id: string, userId: string, data: Prisma.HabitUpdateInput): Promise<Habit> {
    return this.db.habit.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.db.habit.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async archive(id: string, isArchived: boolean): Promise<void> {
    await this.db.habit.update({
      where: { id },
      data: { isArchived, archivedAt: isArchived ? new Date() : null },
    });
  }

  // ── Habit Logs ──────────────────────────────────────────────────

  async findLog(habitId: string, date: Date): Promise<HabitLog | null> {
    return this.db.habitLog.findUnique({
      where: { habitId_logDate: { habitId, logDate: date } },
    });
  }

  async upsertLog(data: {
    habitId: string;
    userId: string;
    logDate: Date;
    status: HabitLogStatus;
    value?: number;
    note?: string;
    skipReason?: string;
    completionCount?: number;
  }): Promise<HabitLog> {
    return this.db.habitLog.upsert({
      where: { habitId_logDate: { habitId: data.habitId, logDate: data.logDate } },
      create: {
        habitId:         data.habitId,
        userId:          data.userId,
        logDate:         data.logDate,
        status:          data.status,
        completionCount: data.completionCount ?? 1,
        ...(data.value      !== undefined ? { value:      data.value      } : {}),
        ...(data.note       !== undefined ? { note:       data.note       } : {}),
        ...(data.skipReason !== undefined ? { skipReason: data.skipReason } : {}),
      },
      update: {
        status:          data.status,
        completionCount: data.completionCount ?? 1,
        ...(data.value      !== undefined ? { value:      data.value      } : {}),
        ...(data.note       !== undefined ? { note:       data.note       } : {}),
        ...(data.skipReason !== undefined ? { skipReason: data.skipReason } : {}),
      },
    });
  }

  async updateLog(habitId: string, logDate: Date, data: {
    status?:            HabitLogStatus;
    value?:             number | null;
    note?:              string | null;
    skipReason?:        string | null;
    customFieldValues?: Record<string, unknown> | null;
  }): Promise<HabitLog> {
    return this.db.habitLog.update({
      where: { habitId_logDate: { habitId, logDate } },
      data: {
        ...(data.status            !== undefined ? { status:            data.status            } : {}),
        ...(data.value             !== undefined ? { value:             data.value             } : {}),
        ...(data.note              !== undefined ? { note:              data.note              } : {}),
        ...(data.skipReason        !== undefined ? { skipReason:        data.skipReason        } : {}),
        ...(data.customFieldValues !== undefined ? {
          customFieldValues: data.customFieldValues === null
            ? Prisma.JsonNull
            : data.customFieldValues as Prisma.InputJsonValue,
        } : {}),
        loggedAt: new Date(),
      },
    });
  }

  async findLogsByDateRange(habitId: string, from: Date, to: Date): Promise<HabitLog[]> {
    return this.db.habitLog.findMany({
      where: { habitId, logDate: { gte: from, lte: to } },
      orderBy: { logDate: 'asc' },
    });
  }

  async findUserLogsForDate(userId: string, date: Date): Promise<HabitLog[]> {
    return this.db.habitLog.findMany({
      where: { userId, logDate: date },
    });
  }

  async getTodayHabits(userId: string, today: Date) {
    // Fetch habits and today's logs in separate queries to avoid Prisma LATERAL JOIN
    // issues that occur with nested relation filters on @db.Date columns.
    const [habits, logs] = await Promise.all([
      this.db.habit.findMany({
        // Event-based habits (e.g. "haircut") have no due-today concept — they never
        // appear here, only in their own dedicated list (see habitType filter on findAll).
        where: { userId, deletedAt: null, isArchived: false, startDate: { lte: today }, habitType: 'regular' },
        select: {
          id:               true,
          title:            true,
          description:      true,
          icon:             true,
          color:            true,
          habitType:        true,
          frequencyType:    true,
          frequencyConfig:  true,
          priority:         true,
          isArchived:       true,
          currentStreak:    true,
          longestStreak:    true,
          totalCompletions: true,
          lastCompletedDate: true,
          startDate:        true,
          categoryId:       true,
          createdAt:        true,
          category:         true,
          customFields:     true,
        },
        orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
      }),
      this.db.habitLog.findMany({
        where: { userId, logDate: today },
      }),
    ]);

    const logByHabitId = new Map(logs.map((l) => [l.habitId, l]));
    return habits.map((h) => ({
      ...h,
      logs: logByHabitId.has(h.id) ? [logByHabitId.get(h.id)!] : [],
    }));
  }
}
