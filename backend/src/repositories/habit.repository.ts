import { PrismaClient, Habit, HabitLog, Prisma, HabitLogStatus } from '@prisma/client';
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
    cursor?: string;
    limit: number;
  }) {
    return this.db.habit.findMany({
      where: {
        userId,
        deletedAt: null,
        isArchived: params.isArchived ?? false,
        ...(params.categoryId ? { categoryId: params.categoryId } : {}),
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
  }): Promise<HabitLog> {
    return this.db.habitLog.upsert({
      where: { habitId_logDate: { habitId: data.habitId, logDate: data.logDate } },
      create: {
        habitId:  data.habitId,
        userId:   data.userId,
        logDate:  data.logDate,
        status:   data.status,
        ...(data.value      !== undefined ? { value:      data.value      } : {}),
        ...(data.note       !== undefined ? { note:       data.note       } : {}),
        ...(data.skipReason !== undefined ? { skipReason: data.skipReason } : {}),
      },
      update: {
        status: data.status,
        ...(data.value      !== undefined ? { value:      data.value      } : {}),
        ...(data.note       !== undefined ? { note:       data.note       } : {}),
        ...(data.skipReason !== undefined ? { skipReason: data.skipReason } : {}),
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
    return this.db.habit.findMany({
      where: { userId, deletedAt: null, isArchived: false, startDate: { lte: today } },
      select: {
        id:               true,
        title:            true,
        description:      true,
        icon:             true,
        color:            true,
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
        logs: { where: { logDate: today }, take: 1 },
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    });
  }
}
