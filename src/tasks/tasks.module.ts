import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { CategoriesModule } from '../categories/categories.module';
import { WebsocketModule } from 'src/websocket/websocket.module';

@Module({
  imports: [CategoriesModule, WebsocketModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
