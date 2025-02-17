import { Module } from '@nestjs/common';
import { YearPlanService } from './year-plan.service';
import { MonthPlanModule } from 'src/month-plan/month-plan.module';

@Module({
  imports: [MonthPlanModule],
  providers: [YearPlanService],
  exports: [YearPlanService],
})
export class YearPlanModule {}
