import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TaskRepository } from './repositories/task.repository';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [CategoriesModule],
  controllers: [TasksController],
  providers: [TasksService, TaskRepository],
  exports: [TasksService],
})
export class TasksModule {}
