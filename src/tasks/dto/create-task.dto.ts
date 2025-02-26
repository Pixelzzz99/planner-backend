import { Priority, TaskStatus } from '@prisma/client';
export class CreateTaskDto {
  title: string;
  description: string;
  priority: Priority;
  duration: number;
  categoryId: string;
  status: TaskStatus;
  day: number;
  date: Date;
}
