import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Body,
  UseGuards,
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

  @Get()
  async getWeekPlans(@Query('weekId') weekPlanId: string) {
    return this.weekPlanService.getWeekPlans(weekPlanId);
  }

  @Delete()
  async deleteWeekPlan(@Query('weeksId') weekPlanId: string) {
    return this.weekPlanService.deleteWeekPlan(weekPlanId);
  }
}
