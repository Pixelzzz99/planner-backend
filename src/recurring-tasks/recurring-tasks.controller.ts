import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/get-user.decorator';
import { RecurringTasksService } from './recurring-tasks.service';
import {
  ApplyRecurringTasksDto,
  CreateRecurringTaskDto,
  UpdateRecurringTaskDto,
} from './dto/recurring-task.dto';

@Controller('recurring-tasks')
@UseGuards(AuthGuard('jwt'))
export class RecurringTasksController {
  constructor(private readonly service: RecurringTasksService) {}

  @Get()
  list(@GetUser('userId') userId: string) {
    return this.service.list(userId);
  }

  @Post()
  create(
    @GetUser('userId') userId: string,
    @Body() data: CreateRecurringTaskDto,
  ) {
    return this.service.create(userId, data);
  }

  @Post('apply')
  apply(
    @GetUser('userId') userId: string,
    @Body() data: ApplyRecurringTasksDto,
  ) {
    return this.service.applyToWeek(userId, data);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
    @Body() data: UpdateRecurringTaskDto,
  ) {
    return this.service.update(id, userId, data);
  }

  @Delete(':id')
  deactivate(@Param('id') id: string, @GetUser('userId') userId: string) {
    return this.service.deactivate(id, userId);
  }
}
