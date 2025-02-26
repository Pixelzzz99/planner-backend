import { Module } from '@nestjs/common';
import { WeekPlanService } from './week-plan.service';
import { WeekPlanController } from './week-plan.controller';

@Module({
  providers: [WeekPlanService],
  controllers: [WeekPlanController],
  exports: [WeekPlanService],
})
export class WeekPlanModule {}
