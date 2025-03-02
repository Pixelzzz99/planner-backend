import { Module } from '@nestjs/common';
import { YearPlanService } from './year-plan.service';
import { MonthPlanModule } from 'src/month-plan/month-plan.module';
import { YearPlanController } from './year-plan.controller';

@Module({
  imports: [MonthPlanModule],
  providers: [YearPlanService],
  exports: [YearPlanService],
  controllers: [YearPlanController],
})
export class YearPlanModule {}
