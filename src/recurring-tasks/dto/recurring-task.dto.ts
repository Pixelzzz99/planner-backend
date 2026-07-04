import { Priority } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateRecurringTaskDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsNumber()
  @IsOptional()
  duration?: number;

  @IsInt()
  @Min(1)
  @Max(7)
  day: number;

  @IsUUID()
  @IsOptional()
  categoryId?: string;
}

export class UpdateRecurringTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsNumber()
  @IsOptional()
  duration?: number;

  @IsInt()
  @Min(1)
  @Max(7)
  @IsOptional()
  day?: number;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class ApplyRecurringTasksDto {
  @IsUUID()
  weekPlanId: string;
}
