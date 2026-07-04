import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateHabitDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  color?: string;
}
