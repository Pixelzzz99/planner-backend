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

  // null = insert at top, undefined (not sent) = append to end, uuid = insert after that task
  @IsOptional()
  afterTaskId?: string | null;
}
