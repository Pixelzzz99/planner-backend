import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto, UpdateGoalDto } from './dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('goals')
@UseGuards(AuthGuard('jwt'))
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post(':userId')
  create(@Param('userId') userId: string, @Body() data: CreateGoalDto) {
    return this.goalsService.createGoal(userId, data);
  }

  @Get(':userId')
  getUserGoals(@Param('userId') userId: string) {
    return this.goalsService.getUserGoals(userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateGoalDto) {
    return this.goalsService.updateGoal(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.goalsService.deleteGoal(id);
  }
}
