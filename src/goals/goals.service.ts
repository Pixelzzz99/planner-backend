import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGoalDto, UpdateGoalDto } from './dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { OwnershipService } from 'src/common/ownership/ownership.service';
import { FocusStatus } from '@prisma/client';

export type GoalWithProgress = {
  id: string;
  userId: string;
  title: string;
  status: string;
  year: number;
  createdAt: Date;
  linkedFocusesTotal: number;
  linkedFocusesCompleted: number;
  focusProgress: number | null;
};

@Injectable()
export class GoalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
  ) {}

  private async attachFocusProgress(
    goals: Awaited<ReturnType<typeof this.prisma.goal.findMany>>,
  ): Promise<GoalWithProgress[]> {
    if (goals.length === 0) return [];

    const goalIds = goals.map((g) => g.id);
    const focuses = await this.prisma.focus.findMany({
      where: {
        goalId: { in: goalIds },
        status: { not: FocusStatus.CANCELED },
      },
      select: { goalId: true, status: true },
    });

    const stats = new Map<
      string,
      { total: number; completed: number }
    >();

    for (const focus of focuses) {
      if (!focus.goalId) continue;
      const entry = stats.get(focus.goalId) ?? { total: 0, completed: 0 };
      entry.total += 1;
      if (focus.status === FocusStatus.COMPLETED) {
        entry.completed += 1;
      }
      stats.set(focus.goalId, entry);
    }

    return goals.map((goal) => {
      const s = stats.get(goal.id);
      const linkedFocusesTotal = s?.total ?? 0;
      const linkedFocusesCompleted = s?.completed ?? 0;
      const focusProgress =
        linkedFocusesTotal > 0
          ? Math.round((linkedFocusesCompleted / linkedFocusesTotal) * 100)
          : null;

      return {
        ...goal,
        linkedFocusesTotal,
        linkedFocusesCompleted,
        focusProgress,
      };
    });
  }

  async createGoal(userId: string, data: CreateGoalDto) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const goal = await this.prisma.goal.create({
        data: {
          ...data,
          year: data.year ?? new Date().getFullYear(),
          userId,
        },
      });
      return {
        ...goal,
        linkedFocusesTotal: 0,
        linkedFocusesCompleted: 0,
        focusProgress: null,
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new NotFoundException('User not found');
      } else {
        throw error;
      }
    }
  }

  async getUserGoals(userId: string, year?: number) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const goals = await this.prisma.goal.findMany({
        where: {
          userId,
          ...(year !== undefined ? { year } : {}),
        },
      });

      return this.attachFocusProgress(goals);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new NotFoundException('User not found');
      } else {
        throw error;
      }
    }
  }

  async updateGoal(id: string, userId: string, data: UpdateGoalDto) {
    try {
      await this.ownership.assertGoalOwner(id, userId);
      const goal = await this.prisma.goal.update({
        where: { id },
        data,
      });
      const [withProgress] = await this.attachFocusProgress([goal]);
      return withProgress;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new NotFoundException('Goal not found');
      } else {
        throw error;
      }
    }
  }

  async deleteGoal(id: string, userId: string) {
    try {
      await this.ownership.assertGoalOwner(id, userId);
      return await this.prisma.goal.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new NotFoundException('Goal not found');
      } else {
        throw error;
      }
    }
  }
}
