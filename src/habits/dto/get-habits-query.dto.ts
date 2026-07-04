import { IsDateString, IsOptional } from 'class-validator';

export class GetHabitsQueryDto {
  @IsDateString()
  @IsOptional()
  weekStart?: string;
}
