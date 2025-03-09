import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Body,
  UseGuards,
  Param,
} from '@nestjs/common';
import { WeekPlanService } from './week-plan.service';
import { CreateWeekPlanDto } from './dto/create-week.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('weeks')
@UseGuards(AuthGuard('jwt'))
export class WeekPlanController {
  constructor(private readonly weekPlanService: WeekPlanService) {}

  @Post()
  async create(@Body() data: CreateWeekPlanDto) {
    return this.weekPlanService.createWeekPlan(data.monthPlanId, data);
  }

  @Get(':weekId')
  async getWeekPlans(@Param('weekId') weekPlanId: string) {
    return this.weekPlanService.getWeekPlans(weekPlanId);
  }

  @Delete(':weekId')
  async deleteWeekPlan(@Param('weekId') weekPlanId: string) {
    return this.weekPlanService.deleteWeekPlan(weekPlanId);
  }
}
