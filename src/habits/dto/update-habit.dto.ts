import { IsOptional, IsString } from 'class-validator';

export class UpdateHabitDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  color?: string;
}
