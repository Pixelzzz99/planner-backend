import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

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
}
