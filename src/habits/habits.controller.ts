import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/get-user.decorator';
import { HabitsService } from './habits.service';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { ToggleHabitLogDto } from './dto/toggle-habit-log.dto';
import { GetHabitsQueryDto } from './dto/get-habits-query.dto';
import { GetHabitsHeatmapQueryDto } from './dto/get-habits-heatmap-query.dto';

@Controller('habits')
@UseGuards(AuthGuard('jwt'))
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Get('heatmap')
  getHeatmap(
    @GetUser('userId') userId: string,
    @Query() query: GetHabitsHeatmapQueryDto,
  ) {
    return this.habitsService.getHeatmap(userId, query.year);
  }

  @Get()
  getHabits(
    @GetUser('userId') userId: string,
    @Query() query: GetHabitsQueryDto,
  ) {
    return this.habitsService.getUserHabits(userId, query.weekStart);
  }

  @Post()
  createHabit(
    @GetUser('userId') userId: string,
    @Body() data: CreateHabitDto,
  ) {
    return this.habitsService.createHabit(userId, data);
  }

  @Patch(':id')
  updateHabit(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
    @Body() data: UpdateHabitDto,
  ) {
    return this.habitsService.updateHabit(id, userId, data);
  }

  @Delete(':id')
  deleteHabit(@Param('id') id: string, @GetUser('userId') userId: string) {
    return this.habitsService.deleteHabit(id, userId);
  }

  @Put(':id/log')
  toggleLog(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
    @Body() data: ToggleHabitLogDto,
  ) {
    return this.habitsService.toggleLog(id, userId, data.date);
  }
}
