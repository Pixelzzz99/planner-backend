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
    const lastTask = await this.prisma.task.findFirst({
      where: {
        weekPlanId,
        day,
        isArchived: false,
      },
      orderBy: { position: 'desc' },
    });
    return lastTask ? lastTask.position + 1024 : 0;
  }

  async createTask(weekPlanId: string, data: CreateTaskDto) {
    const { categoryId, date, ...taskData } = data;

    try {
      // Проверяем существование WeekPlan
      const weekPlan = await this.prisma.weekPlan.findUnique({
        where: { id: weekPlanId },
      });
      if (!weekPlan) {
        throw new WeekPlanNotFoundException(weekPlanId);
      }

      // Проверяем существование Category
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        throw new CategoryNotFoundException(categoryId);
      }

      // Проверяем валидность даты
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        throw new InvalidDateException();
      }

      const position = await this.getLastPosition(weekPlanId, data.day);

      const task = await this.prisma.task.create({
        data: {
          ...taskData,
          position,
          date: parsedDate,
          category: {
            connect: { id: categoryId },
          },
          weekPlan: {
            connect: { id: weekPlanId },
          },
        },
        include: {
          category: {
            select: {
              name: true,
            },
          },
        },
      });

      this.websocket.server.emit('taskCreated', task);
      return task;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new HttpException(
            'Task with this title already exists',
            HttpStatus.CONFLICT,
          );
        }
      }
      console.log(error);
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
      const { position, toArchive, archiveReason, date, ...restData } =
        moveData;

      const updateData: any = {
        ...restData,
        ...(date && { date: new Date(date) }),
      };

      if (position !== undefined) {
        updateData.position = position;
      }

      // Если перемещаем в архив
      if (toArchive) {
        updateData.isArchived = true;
        updateData.archiveReason = archiveReason;
        updateData.archivedAt = new Date();
      }

      // Если перемещаем из архива в неделю
      if (moveData.weekPlanId && !toArchive) {
        updateData.isArchived = false;
        updateData.archiveReason = null;
        updateData.archivedAt = null;
      }

      const task = await this.prisma.task.update({
        where: { id: taskId },
        data: updateData,
        include: {
          category: true,
          weekPlan: true,
        },
      });

      const eventName = toArchive ? 'taskArchived' : 'taskMoved';
      this.websocket.server.emit(eventName, task);

      return task;
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

  async updatePositions(updates: { id: string; position: number }[]) {
    try {
      await this.prisma.$transaction(
        updates.map(({ id, position }) =>
          this.prisma.task.update({
            where: { id },
            data: { position },
          }),
        ),
      );

      return { success: true };
    } catch (error) {
      throw new InternalServerErrorException('Failed to update task positions');
    }
  }
}
