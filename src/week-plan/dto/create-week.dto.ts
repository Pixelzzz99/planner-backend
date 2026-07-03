import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CreateWeekPlanDto {
  @IsUUID()
  @IsOptional()
  monthPlanId?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
