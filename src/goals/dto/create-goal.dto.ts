import { GoalStatus } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGoalDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(GoalStatus)
  @IsOptional()
  status?: GoalStatus;

  @IsInt()
  @IsOptional()
  year?: number;
}
