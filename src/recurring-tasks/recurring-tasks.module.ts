import { Module } from '@nestjs/common';
import { RecurringTasksController } from './recurring-tasks.controller';
import { RecurringTasksService } from './recurring-tasks.service';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [CategoriesModule],
  controllers: [RecurringTasksController],
  providers: [RecurringTasksService],
  exports: [RecurringTasksService],
})
export class RecurringTasksModule {}
