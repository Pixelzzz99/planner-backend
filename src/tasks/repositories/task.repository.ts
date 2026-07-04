import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Task } from '@prisma/client';

const taskInclude = {
  category: {
    select: { name: true },
  },
} as const;

@Injectable()
export class TaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async weekPlanExists(weekPlanId: string): Promise<boolean> {
    const weekPlan = await this.prisma.weekPlan.findUnique({
      where: { id: weekPlanId },
      select: { id: true },
    });
    return !!weekPlan;
  }

  async findTasksByWeekPlan(weekPlanId: string) {
    return this.prisma.task.findMany({
      where: { weekPlanId },
      include: {
        ...taskInclude,
        weekPlan: true,
      },
    });
  }

  async findLastPosition(
    weekPlanId: string,
    day: number,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = tx ?? this.prisma;
    const tasks = await client.task.findMany({
      where: {
        weekPlanId,
        day,
        isArchived: false,
      },
      select: { position: true },
      orderBy: { position: 'desc' },
      take: 1,
    });
    return tasks.length > 0 ? tasks[0].position + 1000 : 1000;
  }

  async createTask(data: Prisma.TaskCreateInput, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.task.create({
      data,
      include: taskInclude,
    });
  }

  async findTaskById(id: string) {
    return this.prisma.task.findUnique({
      where: { id },
      include: {
        category: {
          select: { name: true },
        },
      },
    });
  }

  async updateTask(id: string, data: Prisma.TaskUpdateInput) {
    return this.prisma.task.update({
      where: { id },
      data,
      include: {
        category: {
          select: { name: true },
        },
      },
    });
  }

  async deleteTask(id: string) {
    return this.prisma.task.delete({
      where: { id },
      include: {
        category: {
          select: { name: true },
        },
      },
    });
  }

  async findArchivedTasks(userId: string) {
    return this.prisma.task.findMany({
      where: {
        isArchived: true,
        weekPlan: {
          monthPlan: {
            yearPlan: {
              userId,
            },
          },
        },
      },
      include: {
        category: {
          select: { name: true },
        },
      },
      orderBy: {
        archivedAt: 'desc',
      },
    });
  }

  async findAllNonArchivedTasksForUser(userId: string) {
    return this.prisma.task.findMany({
      where: {
        isArchived: false,
        weekPlan: {
          monthPlan: {
            yearPlan: { userId },
          },
        },
      },
      orderBy: [{ weekPlanId: 'asc' }, { day: 'asc' }, { position: 'asc' }],
    });
  }

  async findAllNonArchivedTasks() {
    return this.prisma.task.findMany({
      where: { isArchived: false },
      orderBy: [{ weekPlanId: 'asc' }, { day: 'asc' }, { position: 'asc' }],
    });
  }

  async updateTasksPositions(tasks: { id: string; position: number }[]) {
    return Promise.all(
      tasks.map(({ id, position }) =>
        this.prisma.task.update({
          where: { id },
          data: { position },
        }),
      ),
    );
  }

  async transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(fn);
  }
}
