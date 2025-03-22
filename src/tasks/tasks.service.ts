import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateTaskDto, UpdateTaskDto } from './dto';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';
import { Prisma, Task } from '@prisma/client';
import {
  TaskNotFoundException,
  CategoryNotFoundException,
  WeekPlanNotFoundException,
  InvalidDateException,
} from '../common/exceptions/task.exceptions';
import { MoveTaskDto } from './dto/move-task.dto';
import { CategoriesService } from '../categories/categories.service';
import { TaskRepository } from './repositories/task.repository';

@Injectable()
export class TasksService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly websocket: WebsocketGateway,
    private readonly categoriesService: CategoriesService,
  ) {}

  private async getLastPosition(
    weekPlanId: string,
    day: number,
  ): Promise<number> {
    const tasks = await this.taskRepository.transaction((tx) =>
      tx.task.findMany({
        where: {
          weekPlanId,
          day,
          isArchived: false,
        },
        select: { position: true },
        orderBy: { position: 'desc' },
        take: 1,
      }),
    );
    return tasks.length > 0 ? tasks[0].position + 1000 : 1000;
  }

  async createTask(weekPlanId: string, data: CreateTaskDto) {
    try {
      return await this.taskRepository.transaction(async (tx) => {
        const [weekPlan, category] = await Promise.all([
          tx.weekPlan.findUnique({ where: { id: weekPlanId } }),
          data.categoryId
            ? tx.category.findUnique({ where: { id: data.categoryId } })
            : Promise.resolve(null),
        ]);

        if (!weekPlan) throw new WeekPlanNotFoundException(weekPlanId);
        if (data.categoryId && !category)
          throw new CategoryNotFoundException(data.categoryId);

        const parsedDate = new Date(data.date);
        if (isNaN(parsedDate.getTime())) throw new InvalidDateException();

        const position = await this.taskRepository.findLastPosition(
          weekPlanId,
          data.day,
        );
        const { categoryId, ...restData } = data;
        const createData = {
          ...restData,
          position,
          date: parsedDate,
          weekPlan: { connect: { id: weekPlanId } },
          category: categoryId ? { connect: { id: categoryId } } : undefined,
        };

        const task = await this.taskRepository.createTask(createData);
        this.websocket.server.emit('taskCreated', task);

        if (task.categoryId) {
          await this.categoriesService.updateActualTime(task.categoryId);
        }

        return task;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new HttpException(
          'Task with this title already exists',
          HttpStatus.CONFLICT,
        );
      }

      if (error instanceof HttpException) {
        throw error;
      }
      console.log('Error creating task:', error);
      throw new InternalServerErrorException('Failed to create task');
    }
  }

  async getTasksForWeek(weekPlanId: string) {
    try {
      const tasks = await this.taskRepository.findTasksByWeekPlan(weekPlanId);
      if (!tasks) {
        throw new WeekPlanNotFoundException(weekPlanId);
      }
      return tasks;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to fetch tasks');
    }
  }

  async updateTask(id: string, data: UpdateTaskDto) {
    try {
      const existingTask = await this.taskRepository.findTaskById(id);
      if (!existingTask) throw new TaskNotFoundException(id);

      if (data.date) {
        const parsedDate = new Date(data.date);
        if (isNaN(parsedDate.getTime())) throw new InvalidDateException();
        data.date = parsedDate;
      }

      const { categoryId, weekPlanId, ...updateData } = data;
      const oldTask = await this.taskRepository.findTaskById(id);

      const updateTaskData = {
        ...updateData,
        ...(categoryId && {
          category: { connect: { id: categoryId } },
        }),
        ...(weekPlanId && {
          weekPlan: { connect: { id: weekPlanId } },
        }),
      };

      const task = await this.taskRepository.updateTask(id, updateTaskData);
      this.websocket.server.emit('taskUpdated', task);

      if (oldTask.categoryId) {
        await this.categoriesService.updateActualTime(oldTask.categoryId);
      }
      if (task.categoryId && task.categoryId !== oldTask.categoryId) {
        await this.categoriesService.updateActualTime(task.categoryId);
      }

      return task;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to update task');
    }
  }

  async deleteTask(id: string) {
    try {
      const existingTask = await this.taskRepository.findTaskById(id);
      if (!existingTask) throw new TaskNotFoundException(id);

      const task = await this.taskRepository.deleteTask(id);
      this.websocket.server.emit('taskDeleted', task);

      if (task.categoryId) {
        await this.categoriesService.updateActualTime(task.categoryId);
      }

      return task;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to delete task');
    }
  }

  private async getSiblingTasks(
    tx: Prisma.TransactionClient,
    day: number,
    weekPlanId: string,
  ) {
    return tx.task.findMany({
      where: { day, weekPlanId },
      orderBy: { position: 'asc' },
      select: { id: true, position: true, title: true },
    });
  }

  private async archiveTask(
    tx: Prisma.TransactionClient,
    taskId: string,
    reason?: string,
  ) {
    return tx.task.update({
      where: { id: taskId },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        archiveReason: reason || null,
      },
      include: {
        category: {
          select: { name: true },
        },
      },
    });
  }

  private async unarchiveTask(
    tx: Prisma.TransactionClient,
    taskId: string,
    day: number,
    weekPlanId: string,
  ) {
    const position = await this.getLastPosition(weekPlanId, day);

    return tx.task.update({
      where: { id: taskId },
      data: {
        isArchived: false,
        archivedAt: null,
        archiveReason: null,
        position,
        day,
        weekPlan: { connect: { id: weekPlanId } },
      },
      include: {
        category: {
          select: { name: true },
        },
      },
    });
  }

  async moveTask(taskId: string, moveData: MoveTaskDto) {
    try {
      const {
        targetTaskId,
        position,
        isArchive,
        archiveReason,
        day,
        weekPlanId,
      } = moveData;

      return this.taskRepository.transaction(async (tx) => {
        const task = await this.taskRepository.findTaskById(taskId);
        if (!task) throw new TaskNotFoundException(taskId);

        if (isArchive !== undefined) {
          if (isArchive && !task.isArchived) {
            const archivedTask = await this.archiveTask(
              tx,
              taskId,
              archiveReason,
            );
            this.websocket.server.emit('taskArchived', archivedTask);
            return archivedTask;
          } else if (!isArchive && task.isArchived) {
            const unarchivedTask = await this.unarchiveTask(
              tx,
              taskId,
              day,
              weekPlanId,
            );
            this.websocket.server.emit('taskUnarchived', unarchivedTask);
            return unarchivedTask;
          }
        }

        if (!targetTaskId) {
          const updatedTask = await this.taskRepository.updateTask(taskId, {
            day,
            position,
          });
          this.websocket.server.emit('taskMoved', updatedTask);
          return updatedTask;
        }

        const siblingTasks = await this.getSiblingTasks(tx, day, weekPlanId);
        const tasksInDestination = siblingTasks.filter((t) => t.id !== taskId);

        const isConflict = tasksInDestination.some(
          (t) => t.position === position,
        );

        let newPosition: number;
        if (isConflict) {
          const targetIndex = tasksInDestination.findIndex(
            (t) => t.id === targetTaskId,
          );

          const updatedTasks = [...tasksInDestination];
          updatedTasks.splice(targetIndex, 0, task);
          newPosition =
            (updatedTasks.findIndex((t) => t.id === taskId) + 1) * 1000;

          Promise.all(
            updatedTasks.map((t, i) =>
              tx.task.update({
                where: { id: t.id },
                data: { position: (i + 1) * 1000 },
              }),
            ),
          );
        } else {
          newPosition = position;
        }

        const updatedTask = await tx.task.update({
          where: { id: taskId },
          data: { day, position: newPosition },
          include: { category: { select: { name: true } } },
        });

        this.websocket.server.emit('taskMoved', updatedTask);
        return updatedTask;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException(
          'Invalid task operation',
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new InternalServerErrorException(
        'Failed to process task operation',
      );
    }
  }

  async getArchivedTasks(userId: string) {
    try {
      return await this.taskRepository.findArchivedTasks(userId);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch archived tasks');
    }
  }

  async fixAllPositions() {
    try {
      const tasks = await this.taskRepository.findAllNonArchivedTasks();
      const groupedTasks = tasks.reduce(
        (acc, task) => {
          const key = `${task.weekPlanId}-${task.day}`;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(task);
          return acc;
        },
        {} as Record<string, Task[]>,
      );

      for (const group of Object.values(groupedTasks)) {
        group.sort((a, b) => a.position - b.position);
        let currentPosition = 1000;
        const updatePromises = group.map((task) => {
          let pos = currentPosition;
          const result = this.taskRepository.updateTask(task.id, {
            position: pos,
          });
          currentPosition += 1000;

          return result;
        });
        await Promise.all(updatePromises);
      }

      return { message: 'All positions have been fixed' };
    } catch (error) {
      console.error('Error fixing positions:', error);
      throw new InternalServerErrorException('Failed to fix positions');
    }
  }
}
