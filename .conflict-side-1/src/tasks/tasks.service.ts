import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './dto';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly websocket: WebsocketGateway,
  ) {}

  // async createTask(weekPlanId: string, data: CreateTaskDto) {
  //   const task = this.prisma.task.create({
  //     data: { ...data, weekPlanId },
  //   });

  //   this.websocket.server.emit('taskUpdated', task);

  //   return task;
  // }

  async getTasksForWeek(weekPlanId: string) {
    return this.prisma.task.findMany({
      where: {
        weekPlanId,
      },
    });
  }

  async updateTask(id: string, data: UpdateTaskDto) {
    const task = this.prisma.task.update({
      where: { id },
      data,
    });

    this.websocket.server.emit('taskUpdated', task);

    return task;
  }

  async deleteTask(id: string) {
    const task = this.prisma.task.delete({ where: { id } });

    this.websocket.server.emit('taskDeleted', task);

    return task;
  }
}
