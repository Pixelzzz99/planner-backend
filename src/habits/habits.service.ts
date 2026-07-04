import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { OwnershipService } from 'src/common/ownership/ownership.service';

function toDateOnly(value: string | Date): Date {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function calculateStreak(
  completedDates: Set<string>,
  today: Date,
): number {
  let streak = 0;
  let cursor = new Date(today);

  while (completedDates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

@Injectable()
export class HabitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
  ) {}

  private async assertHabitOwner(habitId: string, userId: string) {
    const habit = await this.prisma.habit.findUnique({
      where: { id: habitId },
      select: { userId: true },
    });
    if (!habit) {
      throw new NotFoundException(`Habit ${habitId} not found`);
    }
    await this.ownership.assertUserSelf(habit.userId, userId);
    return habit;
  }

  async getUserHabits(userId: string, weekStart?: string) {
    const habits = await this.prisma.habit.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    if (!weekStart) {
      return habits.map((habit) => ({ ...habit, logs: [], streak: 0 }));
    }

    const start = toDateOnly(weekStart);
    const end = addDays(start, 6);

    const logs = await this.prisma.habitLog.findMany({
      where: {
        habitId: { in: habits.map((h) => h.id) },
        date: { gte: start, lte: end },
      },
    });

    const allCompletedLogs = await this.prisma.habitLog.findMany({
      where: {
        habitId: { in: habits.map((h) => h.id) },
        completed: true,
      },
      select: { habitId: true, date: true },
    });

    const today = toDateOnly(new Date());

    return habits.map((habit) => {
      const habitLogs = logs.filter((log) => log.habitId === habit.id);
      const completedDates = new Set<string>(
        allCompletedLogs
          .filter((log) => log.habitId === habit.id)
          .map((log) => toDateOnly(log.date).toISOString().slice(0, 10)),
      );

      return {
        ...habit,
        logs: habitLogs,
        streak: calculateStreak(completedDates, today),
      };
    });
  }

  async createHabit(userId: string, data: CreateHabitDto) {
    return this.prisma.habit.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async updateHabit(id: string, userId: string, data: UpdateHabitDto) {
    await this.assertHabitOwner(id, userId);
    return this.prisma.habit.update({
      where: { id },
      data,
    });
  }

  async deleteHabit(id: string, userId: string) {
    await this.assertHabitOwner(id, userId);
    return this.prisma.habit.delete({ where: { id } });
  }

  async getHeatmap(userId: string, year: number) {
    const start = toDateOnly(`${year}-01-01`);
    const end = toDateOnly(`${year}-12-31`);

    const habits = await this.prisma.habit.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, title: true, color: true },
    });

    if (habits.length === 0) {
      return { year, habits: [] };
    }

    const logs = await this.prisma.habitLog.findMany({
      where: {
        habitId: { in: habits.map((h) => h.id) },
        completed: true,
        date: { gte: start, lte: end },
      },
      select: { habitId: true, date: true },
    });

    const logsByHabit = new Map<string, string[]>();
    for (const log of logs) {
      const dateKey = toDateOnly(log.date).toISOString().slice(0, 10);
      const existing = logsByHabit.get(log.habitId) ?? [];
      existing.push(dateKey);
      logsByHabit.set(log.habitId, existing);
    }

    return {
      year,
      habits: habits.map((habit) => {
        const completedDates = logsByHabit.get(habit.id) ?? [];
        return {
          ...habit,
          completedDates,
          totalCompleted: completedDates.length,
        };
      }),
    };
  }

  async toggleLog(id: string, userId: string, date: string) {
    await this.assertHabitOwner(id, userId);
    const dateOnly = toDateOnly(date);

    const existing = await this.prisma.habitLog.findUnique({
      where: {
        habitId_date: {
          habitId: id,
          date: dateOnly,
        },
      },
    });

    if (existing) {
      if (existing.completed) {
        return this.prisma.habitLog.delete({
          where: { id: existing.id },
        });
      }
      return this.prisma.habitLog.update({
        where: { id: existing.id },
        data: { completed: true },
      });
    }

    return this.prisma.habitLog.create({
      data: {
        habitId: id,
        date: dateOnly,
        completed: true,
      },
    });
  }
}
