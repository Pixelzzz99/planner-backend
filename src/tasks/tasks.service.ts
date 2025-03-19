import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
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
    return tasks.length > 0 ? tasks[0].position + 1000 : 1000;
  }

  async createTask(weekPlanId: string, data: CreateTaskDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const [weekPlan, category] = await Promise.all([
          tx.weekPlan.findUnique({
            where: { id: weekPlanId },
          }),
          data.categoryId
            ? tx.category.findUnique({
                where: { id: data.categoryId },
              })
            : Promise.resolve(null),
        ]);

        if (!weekPlan) {
          throw new WeekPlanNotFoundException(weekPlanId);
        }

        if (data.categoryId && !category) {
          throw new CategoryNotFoundException(data.categoryId);
        }

        const parsedDate = new Date(data.date);
        if (isNaN(parsedDate.getTime())) {
          throw new InvalidDateException();
        }

        const position = await this.getLastPosition(weekPlanId, data.day);

        const createData: Prisma.TaskCreateInput = {
          ...data,
          position,
          date: parsedDate,
          weekPlan: { connect: { id: weekPlanId } },
          category: data.categoryId
            ? { connect: { id: data.categoryId } }
            : undefined,
        };

        const task = await tx.task.create({
          data: createData,
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

  private calculatePosition(
    prevItem: { position: number } | undefined,
    nextItem: { position: number } | undefined,
  ): number {
    if (!prevItem && !nextItem) return 1024;
    if (!prevItem) return nextItem!.position - 1024;
    if (!nextItem) return prevItem.position + 1024;
    return (prevItem.position + nextItem.position) / 2;
  }

  private async moveToEmptyDay(
    tx: Prisma.TransactionClient,
    taskId: string,
    day: number,
    weekPlanId: string,
  ) {
    return tx.task.update({
      where: { id: taskId },
      data: {
        position: 1 + 1024,
        day,
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
        position, // теперь число
        isArchive,
        archiveReason,
        day, // destination day
        weekPlanId,
      } = moveData;
      console.log(moveData);

      return this.prisma.$transaction(async (tx) => {
        // Проверяем существование задачи
        const task = await tx.task.findUnique({ where: { id: taskId } });
        if (!task) {
          throw new TaskNotFoundException(taskId);
        }

        // Обработка архивации/разархивации
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

        // Если targetTaskId не указан – считаем, что перемещение в пустой день или добавление в конец
        if (!targetTaskId) {
          const updatedTask = await tx.task.update({
            where: { id: taskId },
            data: { day, position },
            include: { category: { select: { name: true } } },
          });
          this.websocket.server.emit('taskMoved', updatedTask);
          return updatedTask;
        }

        // Если targetTaskId указан, проверяем, не возникнет ли конфликт позиций в целевом дне
        const siblingTasks = await this.getSiblingTasks(tx, day, weekPlanId);
        // Исключаем перемещаемую задачу (если она уже присутствует)
        const tasksInDestination = siblingTasks.filter((t) => t.id !== taskId);

        // Если уже есть задача с такой позицией, пересчитаем порядок
        const isConflict = tasksInDestination.some(
          (t) => t.position === position,
        );

        let newPosition: number;
        if (isConflict) {
          // Находим индекс target задачи в списке задач нового дня
          const targetIndex = tasksInDestination.findIndex(
            (t) => t.id === targetTaskId,
          );

          // Вставляем перемещаемую задачу в этот список по targetIndex
          const updatedTasks = [...tasksInDestination];
          updatedTasks.splice(targetIndex, 0, task);
          // Пересчитываем позиции для всех задач целевого дня
          newPosition =
            (updatedTasks.findIndex((t) => t.id === taskId) + 1) * 1000;

          // (Опционально) можно обновить позиции всех задач destination-дня,
          // чтобы сохранить единообразный порядок.
          // Например,
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
        where: { isArchived: false },
        // Можно дополнительно отсортировать по weekPlanId и day,
        // чтобы группировка была более последовательной
        orderBy: [{ weekPlanId: 'asc' }, { day: 'asc' }, { position: 'asc' }],
      });

      // Группируем задачи по комбинации weekPlanId и day
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

      // Обновляем позиции для каждой группы
      for (const group of Object.values(groupedTasks)) {
        // Убедимся, что задачи в группе отсортированы по текущей позиции
        group.sort((a, b) => a.position - b.position);
        let currentPosition = 1000;
        // Для каждой задачи рассчитываем новую позицию и обновляем её в БД
        const updatePromises = group.map((task) => {
          let pos = currentPosition;
          const result = this.prisma.task.update({
            where: { id: task.id },
            data: { position: pos },
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
