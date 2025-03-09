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

@Controller('tasks')
@UseGuards(AuthGuard('jwt'))
export class TasksController {
  constructor(private readonly taskService: TasksService) {}

  @Get('archived')
  getArchivedTasks(@GetUser('userId') userId: string) {
    return this.taskService.getArchivedTasks(userId);
  }

  @Get(':weekPlanId')
  getTasksForWeek(@Param('weekPlanId') weekPlanId: string) {
    return this.taskService.getTasksForWeek(weekPlanId);
  }

  @Post()
  createTask(@Query('weekId') weekPlanId: string, @Body() data: CreateTaskDto) {
    return this.taskService.createTask(weekPlanId, data);
  }

  @Patch(':id')
  updateTask(@Param('id') id: string, @Body() data: UpdateTaskDto) {
    return this.taskService.updateTask(id, data);
  }

  @Patch(':id/move')
  moveTask(
    @Param('id') id: string,
    @Body() moveData: { weekPlanId?: string; day?: number; date?: string },
  ) {
    return this.taskService.moveTask(id, {
      ...moveData,
      date: moveData.date ? moveData.date : undefined,
    });
  }

  @Patch('positions')
  updatePositions(@Body() updates: { id: string; position: number }[]) {
    return this.taskService.updatePositions(updates);
  }

  @Delete(':id')
  deleteTask(@Param('id') id: string) {
    return this.taskService.deleteTask(id);
  }
}
