import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TaskRepository } from './repositories/task.repository';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [WebsocketModule, CategoriesModule],
  controllers: [TasksController],
  providers: [TasksService, TaskRepository],
  exports: [TasksService],
})
export class TasksModule {}
