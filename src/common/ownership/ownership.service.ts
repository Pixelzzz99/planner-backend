import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OwnershipService {
  constructor(private readonly prisma: PrismaService) {}

  async getWeekPlanOwnerId(weekPlanId: string): Promise<string | null> {
    const weekPlan = await this.prisma.weekPlan.findUnique({
      where: { id: weekPlanId },
      select: {
        monthPlan: {
          select: {
            yearPlan: { select: { userId: true } },
          },
        },
      },
    });
    return weekPlan?.monthPlan?.yearPlan?.userId ?? null;
  }

  async assertWeekPlanOwner(weekPlanId: string, userId: string): Promise<void> {
    const ownerId = await this.getWeekPlanOwnerId(weekPlanId);
    if (!ownerId) {
      throw new NotFoundException(`Week plan ${weekPlanId} not found`);
    }
    if (ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }
  }

  async assertTaskOwner(taskId: string, userId: string): Promise<void> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: {
        weekPlan: {
          select: {
            monthPlan: {
              select: {
                yearPlan: { select: { userId: true } },
              },
            },
          },
        },
      },
    });
    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }
    const ownerId = task.weekPlan?.monthPlan?.yearPlan?.userId;
    if (ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }
  }

  async assertGoalOwner(goalId: string, userId: string): Promise<void> {
    const goal = await this.prisma.goal.findUnique({
      where: { id: goalId },
      select: { userId: true },
    });
    if (!goal) {
      throw new NotFoundException(`Goal ${goalId} not found`);
    }
    if (goal.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
  }

  async assertCategoryOwner(categoryId: string, userId: string): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { userId: true },
    });
    if (!category) {
      throw new NotFoundException(`Category ${categoryId} not found`);
    }
    if (category.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
  }

  async assertMonthPlanOwner(monthPlanId: string, userId: string): Promise<void> {
    const monthPlan = await this.prisma.monthPlan.findUnique({
      where: { id: monthPlanId },
      select: {
        yearPlan: { select: { userId: true } },
      },
    });
    if (!monthPlan) {
      throw new NotFoundException(`Month plan ${monthPlanId} not found`);
    }
    if (monthPlan.yearPlan.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
  }

  async assertFocusOwner(focusId: string, userId: string): Promise<void> {
    const focus = await this.prisma.focus.findUnique({
      where: { id: focusId },
      select: {
        weekPlan: {
          select: {
            monthPlan: {
              select: {
                yearPlan: { select: { userId: true } },
              },
            },
          },
        },
      },
    });
    if (!focus) {
      throw new NotFoundException(`Focus ${focusId} not found`);
    }
    const ownerId = focus.weekPlan?.monthPlan?.yearPlan?.userId;
    if (ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }
  }

  async assertUserSelf(targetUserId: string, userId: string): Promise<void> {
    if (targetUserId !== userId) {
      throw new ForbiddenException('Access denied');
    }
  }
}
