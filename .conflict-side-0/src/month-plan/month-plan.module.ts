import { Module } from '@nestjs/common';
import { MonthPlanService } from './month-plan.service';

@Module({
  providers: [MonthPlanService],
  exports: [MonthPlanService],
})
export class MonthPlanModule {}
