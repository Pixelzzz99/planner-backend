import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { WeekPlanService } from './week-plan.service';
import { CreateWeekPlanDto } from './dto/create-week.dto';

@Controller('weeks')
export class WeekPlanController {
  constructor(private readonly weekPlanService: WeekPlanService) {}

  @Post()
  async create(@Body() data: CreateWeekPlanDto) {
    console.log('here');
    return this.weekPlanService.createWeekPlan(data.monthPlanId, data);
  }
}
