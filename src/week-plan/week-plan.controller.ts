import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  Param,
} from '@nestjs/common';
import { WeekPlanService } from './week-plan.service';
import { CreateWeekPlanDto } from './dto/create-week.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/get-user.decorator';

@Controller('weeks')
@UseGuards(AuthGuard('jwt'))
export class WeekPlanController {
  constructor(private readonly weekPlanService: WeekPlanService) {}

  @Post()
  async create(
    @Body() data: CreateWeekPlanDto,
    @GetUser('userId') userId: string,
  ) {
    return this.weekPlanService.createWeekPlan(data.monthPlanId, userId, data);
  }

  @Get(':weekId')
  async getWeekPlans(
    @Param('weekId') weekPlanId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.weekPlanService.getWeekPlans(weekPlanId, userId);
  }

  @Delete(':weekId')
  async deleteWeekPlan(
    @Param('weekId') weekPlanId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.weekPlanService.deleteWeekPlan(weekPlanId, userId);
  }
}
