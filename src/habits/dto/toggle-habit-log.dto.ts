import { IsDateString } from 'class-validator';

export class ToggleHabitLogDto {
  @IsDateString()
  date: string;
}
