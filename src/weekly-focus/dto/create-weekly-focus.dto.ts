import { IsNotEmpty, IsString, IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class CreateWeeklyFocusDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  status?: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';

  @ValidateIf((_, v) => v !== null)
  @IsOptional()
  @IsUUID()
  goalId?: string | null;
}
