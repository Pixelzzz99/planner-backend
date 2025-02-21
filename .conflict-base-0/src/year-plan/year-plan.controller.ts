import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { YearPlanService } from './year-plan.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('year-plan')
@UseGuards(AuthGuard('jwt'))
export class YearPlanController {
  constructor(private readonly yearPlanService: YearPlanService) {}

  @Post()
  create(@Body() data: { userId: string }) {
    return this.yearPlanService.create(data.userId);
  }

  @Get('/:userId')
  getUserYearPlan(@Param('userId') userId: string) {
    return this.yearPlanService.findOne(userId);
  }
}
