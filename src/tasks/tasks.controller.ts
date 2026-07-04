import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/get-user.decorator';
import { MoveTaskDto } from './dto/move-task.dto';

@Controller('tasks')
@UseGuards(AuthGuard('jwt'))
export class TasksController {
  constructor(private readonly taskService: TasksService) {}

  @Get('archived')
  getArchivedTasks(@GetUser('userId') userId: string) {
    return this.taskService.getArchivedTasks(userId);
  }

  @Post('fix-positions')
  async fixPositions(@GetUser('userId') userId: string) {
    return this.taskService.fixAllPositions(userId);
  }

  @Get(':weekPlanId')
  getTasksForWeek(
    @Param('weekPlanId') weekPlanId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.taskService.getTasksForWeek(weekPlanId, userId);
  }

  @Post()
  createTask(
    @Query('weekId') weekPlanId: string,
    @Body() data: CreateTaskDto,
    @GetUser('userId') userId: string,
  ) {
    return this.taskService.createTask(weekPlanId, userId, data);
  }

  @Patch(':id')
  updateTask(
    @Param('id') id: string,
    @Body() data: UpdateTaskDto,
    @GetUser('userId') userId: string,
  ) {
    return this.taskService.updateTask(id, userId, data);
  }

  @Patch(':id/move')
  moveTask(
    @Param('id') id: string,
    @Body() moveData: MoveTaskDto,
    @GetUser('userId') userId: string,
  ) {
    return this.taskService.moveTask(id, userId, {
      ...moveData,
      date: moveData.date ? moveData.date : undefined,
    });
  }

  @Delete(':id')
  deleteTask(@Param('id') id: string, @GetUser('userId') userId: string) {
    return this.taskService.deleteTask(id, userId);
  }
}
