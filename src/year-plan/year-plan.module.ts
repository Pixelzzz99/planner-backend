import { Module } from '@nestjs/common';
import { YearPlanService } from './year-plan.service';

@Module({
  providers: [YearPlanService],
  exports: [YearPlanService],
})
export class YearPlanModule {}
