import { Module } from '@nestjs/common';
import { WeeklyFocusController } from './weekly-focus.controller';
import { WeeklyFocusService } from './weekly-focus.service';

@Module({
  controllers: [WeeklyFocusController],
  providers: [WeeklyFocusService],
})
export class WeeklyFocusModule {}
