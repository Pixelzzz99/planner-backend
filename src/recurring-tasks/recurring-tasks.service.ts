import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OwnershipService } from 'src/common/ownership/ownership.service';
import { CategoriesService } from 'src/categories/categories.service';
import {
  ApplyRecurringTasksDto,
  CreateRecurringTaskDto,
  UpdateRecurringTaskDto,
} from './dto/recurring-task.dto';

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

@Injectable()
export class RecurringTasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
    private readonly categoriesService: CategoriesService,
  ) {}

  async list(userId: string) {
    return this.prisma.recurringTask.findMany({
      where: { userId, active: true },
      orderBy: [{ day: 'asc' }, { createdAt: 'asc' }],
      include: { category: true },
    });
  }

  async create(userId: string, data: CreateRecurringTaskDto) {
    if (data.categoryId) {
      await this.ownership.assertCategoryOwner(data.categoryId, userId);
    }

    return this.prisma.recurringTask.create({
      data: { ...data, userId },
      include: { category: true },
    });
  }

  async update(id: string, userId: string, data: UpdateRecurringTaskDto) {
    const existing = await this.prisma.recurringTask.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException(`Recurring task ${id} not found`);
    await this.ownership.assertUserSelf(existing.userId, userId);

    if (data.categoryId) {
      await this.ownership.assertCategoryOwner(data.categoryId, userId);
    }

    return this.prisma.recurringTask.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async deactivate(id: string, userId: string) {
    const existing = await this.prisma.recurringTask.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException(`Recurring task ${id} not found`);
    await this.ownership.assertUserSelf(existing.userId, userId);

    return this.prisma.recurringTask.update({
      where: { id },
      data: { active: false },
    });
  }

  async applyToWeek(userId: string, { weekPlanId }: ApplyRecurringTasksDto) {
    await this.ownership.assertWeekPlanOwner(weekPlanId, userId);

    const [weekPlan, templates, existingInstances] = await Promise.all([
      this.prisma.weekPlan.findUnique({ where: { id: weekPlanId } }),
      this.prisma.recurringTask.findMany({
        where: { userId, active: true },
      }),
      this.prisma.task.findMany({
        where: { weekPlanId, recurringTaskId: { not: null }, isArchived: false },
        select: { recurringTaskId: true },
      }),
    ]);

    if (!weekPlan) throw new NotFoundException(`Week plan ${weekPlanId} not found`);

    const existingTemplateIds = new Set(
      existingInstances.map((t) => t.recurringTaskId).filter(Boolean),
    );

    const created = [];

    for (const template of templates) {
      if (existingTemplateIds.has(template.id)) continue;

      const taskDate = addDays(weekPlan.startDate, template.day - 1);
      const lastTasks = await this.prisma.task.findMany({
        where: { weekPlanId, day: template.day, isArchived: false },
        orderBy: { position: 'desc' },
        take: 1,
        select: { position: true },
      });
      const position =
        lastTasks.length > 0 ? lastTasks[0].position + 1000 : 1000;

      const task = await this.prisma.task.create({
        data: {
          weekPlanId,
          recurringTaskId: template.id,
          title: template.title,
          description: template.description ?? '',
          priority: template.priority,
          duration: template.duration,
          day: template.day,
          date: taskDate,
          position,
          categoryId: template.categoryId,
          status: 'TODO',
        },
        include: { category: true },
      });

      if (task.categoryId) {
        await this.categoriesService.updateActualTime(task.categoryId);
      }

      created.push(task);
    }

    return { created: created.length, tasks: created };
  }
}
