import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './dto';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';
import { Prisma } from '@prisma/client';
import {
  TaskNotFoundException,
  CategoryNotFoundException,
  WeekPlanNotFoundException,
  InvalidDateException,
} from '../common/exceptions/task.exceptions';
import { MoveTaskDto } from './dto/move-task.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly websocket: WebsocketGateway,
  ) {}

  private async getLastPosition(
    weekPlanId: string,
    day: number,
  ): Promise<number> {
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
    return tasks.length > 0 ? tasks[0].position + 1024 : 0;
  }

  async createTask(weekPlanId: string, data: CreateTaskDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Проверяем существование WeekPlan и Category одним запросом
        const [weekPlan, category] = await Promise.all([
          tx.weekPlan.findUnique({ where: { id: weekPlanId } }),
          tx.category.findUnique({ where: { id: data.categoryId } }),
        ]);

        if (!weekPlan) {
          throw new WeekPlanNotFoundException(weekPlanId);
        }
        if (!category) {
          throw new CategoryNotFoundException(data.categoryId);
        }

        // Проверяем валидность даты
        const parsedDate = new Date(data.date);
        if (isNaN(parsedDate.getTime())) {
          throw new InvalidDateException();
        }

        // Получаем последнюю позицию и создаем задачу в одной транзакции
        const position = await this.getLastPosition(weekPlanId, data.day);

        const { categoryId, ...restData } = data;
        const task = await tx.task.create({
          data: {
            ...restData,
            position,
            date: parsedDate,
            category: { connect: { id: categoryId } },
            weekPlan: { connect: { id: weekPlanId } },
          },
          include: {
            category: {
              select: { name: true },
            },
          },
        });

        this.websocket.server.emit('taskCreated', task);
        return task;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new HttpException(
            'Task with this title already exists',
            HttpStatus.CONFLICT,
          );
        }
      }

      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create task');
    }
  }

  async getTasksForWeek(weekPlanId: string) {
    try {
      const weekPlan = await this.prisma.weekPlan.findUnique({
        where: { id: weekPlanId },
      });
      if (!weekPlan) {
        throw new WeekPlanNotFoundException(weekPlanId);
      }

      return await this.prisma.task.findMany({
        where: { weekPlanId },
        include: {
          category: {
            select: {
              name: true,
            },
          },
          weekPlan: true,
        },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch tasks');
    }
  }

  async updateTask(id: string, data: UpdateTaskDto) {
    try {
      const existingTask = await this.prisma.task.findUnique({
        where: { id },
      });
      if (!existingTask) {
        throw new TaskNotFoundException(id);
      }

      if (data.date) {
        const parsedDate = new Date(data.date);
        if (isNaN(parsedDate.getTime())) {
          throw new InvalidDateException();
        }
        data.date = parsedDate;
      }

      const { categoryId, weekPlanId, ...updateData } = data;

      const task = await this.prisma.task.update({
        where: { id },
        data: {
          ...updateData,
          ...(categoryId && {
            category: {
              connect: { id: categoryId },
            },
          }),
          ...(weekPlanId && {
            weekPlan: {
              connect: { id: weekPlanId },
            },
          }),
        },
        include: {
          category: {
            select: {
              name: true,
            },
          },
        },
      });

      this.websocket.server.emit('taskUpdated', task);
      return task;
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update task');
    }
  }

  async deleteTask(id: string) {
    try {
      const existingTask = await this.prisma.task.findUnique({
        where: { id },
      });
      if (!existingTask) {
        throw new TaskNotFoundException(id);
      }

      const task = await this.prisma.task.delete({
        where: { id },
        include: {
          category: {
            select: {
              name: true,
            },
          },
        },
      });

      this.websocket.server.emit('taskDeleted', task);
      return task;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete task');
    }
  }

  async moveTask(taskId: string, moveData: MoveTaskDto) {
    try {
      const {
        targetTaskId,
        position,
        toArchive,
        archiveReason,
        date,
        day,
        weekPlanId,
      } = moveData;

      return this.prisma.$transaction(async (tx) => {
        const [targetItem, siblingItem] = await Promise.all([
          tx.task.findUnique({ where: { id: targetTaskId, day, weekPlanId } }),
          tx.task.findMany({
            where: {
              day,
            },
            orderBy: { position: 'asc' },
            select: { id: true, position: true },
          }),
        ]);
        let newPosition: number;

        const targetIndex = siblingItem.findIndex(
          (item) => item.id === targetTaskId,
        );
        const newIndex = position === 'before' ? targetIndex : targetIndex + 1;

        const prevItem = siblingItem[newIndex - 1];
        const nextItem = siblingItem[newIndex];

        if (!prevItem && !nextItem) {
          newPosition = 1.0;
        } else if (!prevItem) {
          newPosition = nextItem.position - 1024;
        } else if (!nextItem) {
          newPosition = prevItem.position + 1024;
        } else {
          const prevItemPosition = prevItem.position;
          const nextItemPosition = nextItem.position;
          newPosition = (prevItemPosition + nextItemPosition) / 2;
        }

        if (Math.random() < 0.01) {
          await this.fixAllPositions();
        }

        return tx.task.update({
          where: { id: taskId },
          data: {
            position: newPosition,
            day,
          },
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException(
          'Invalid task move operation',
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new InternalServerErrorException('Failed to move task');
    }
  }

  async getArchivedTasks(userId: string) {
    try {
      return await this.prisma.task.findMany({
        where: {
          isArchived: true,
          category: {
            userId: userId,
          },
        },
        include: {
          category: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          archivedAt: 'desc',
        },
      });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Failed to fetch archived tasks');
    }
  }

  async fixAllPositions() {
    try {
      // Получаем все неархивированные задачи
      const tasks = await this.prisma.task.findMany({
        where: {
          isArchived: false,
        },
        orderBy: {
          position: 'asc',
        },
      });

      // Группируем задачи по weekPlanId и day
      const groupedTasks = tasks.reduce(
        (acc, task) => {
          const key = `${task.weekPlanId}-${task.day}`;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(task);
          return acc;
        },
        {} as Record<string, any[]>,
      );
      // Обновляем позиции для каждой группы
      for (const tasks of Object.values(groupedTasks)) {
        // Начинаем с 1.0 и увеличиваем на 1024 для каждой следующей задачи
        let currentPosition = 1.0;

        for (let i = 1; i <= tasks.length; i++) {
          await this.prisma.task.update({
            where: { id: tasks[i - 1].id },
            data: { position: currentPosition },
          });
          currentPosition += 1024;
        }
      }

      return { message: 'All positions have been fixed' };
    } catch (error) {
      console.error('Error fixing positions:', error);
      throw new InternalServerErrorException('Failed to fix positions');
    }
  }
}
