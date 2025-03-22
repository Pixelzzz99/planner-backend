import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Task } from '@prisma/client';

@Injectable()
export class TaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findTasksByWeekPlan(weekPlanId: string) {
    return this.prisma.task.findMany({
      where: { weekPlanId },
      include: {
        category: {
          select: { name: true },
        },
        weekPlan: true,
      },
    });
  }

  async findLastPosition(weekPlanId: string, day: number): Promise<number> {
    const tasks = await this.prisma.task.findMany({
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

  async createTask(data: Prisma.TaskCreateInput) {
    return this.prisma.task.create({
      data,
      include: {
        category: {
          select: { name: true },
        },
      },
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
        category: {
          userId: userId,
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
