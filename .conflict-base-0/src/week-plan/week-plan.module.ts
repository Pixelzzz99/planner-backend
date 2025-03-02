import { Module } from '@nestjs/common';
import { WeekPlanService } from './week-plan.service';
import { WeekPlanController } from './week-plan.controller';
import { WeeklyFocusModule } from 'src/weekly-focus/weekly-focus.module';

@Module({
  imports: [WeeklyFocusModule],
  providers: [WeekPlanService],
  controllers: [WeekPlanController],
  exports: [WeekPlanService],
})
export class WeekPlanModule {}
