import { Module } from '@nestjs/common';
import { WeekPlanService } from './week-plan.service';

@Module({
  providers: [WeekPlanService],
  exports: [WeekPlanService],
})
export class WeekPlanModule {}
