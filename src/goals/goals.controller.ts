import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto, UpdateGoalDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/get-user.decorator';

@Controller('goals')
@UseGuards(AuthGuard('jwt'))
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  create(@GetUser('userId') userId: string, @Body() data: CreateGoalDto) {
    return this.goalsService.createGoal(userId, data);
  }

  @Get()
  getUserGoals(
    @GetUser('userId') userId: string,
    @Query('year') year?: string,
  ) {
    return this.goalsService.getUserGoals(
      userId,
      year ? parseInt(year, 10) : undefined,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: UpdateGoalDto,
    @GetUser('userId') userId: string,
  ) {
    return this.goalsService.updateGoal(id, userId, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @GetUser('userId') userId: string) {
    return this.goalsService.deleteGoal(id, userId);
  }
}
