import { Priority, TaskStatus } from '@prisma/client';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsUUID,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsEnum(Priority)
  priority: Priority;

  @IsNumber()
  @IsNotEmpty()
  duration: number;

  @IsNumber()
  @IsOptional()
  position?: number;

  @IsUUID()
  categoryId: string;

  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsNumber()
  day: number;

  @IsString()
  @IsNotEmpty()
  date: string | Date;
}
