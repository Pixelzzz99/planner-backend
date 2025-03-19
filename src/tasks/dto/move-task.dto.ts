import {
  IsOptional,
  IsUUID,
  IsNumber,
  IsDateString,
  IsString,
  IsBoolean,
} from 'class-validator';

export class MoveTaskDto {
  @IsOptional()
  @IsUUID()
  weekPlanId?: string;

  @IsOptional()
  @IsNumber()
  day?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsBoolean()
  isArchive?: boolean;

  @IsOptional()
  @IsString()
  archiveReason?: string;

  @IsOptional()
  @IsString()
  targetTaskId?: string;

  @IsOptional()
  @IsNumber()
  position: number;
}
