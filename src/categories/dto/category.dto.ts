import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';
export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsOptional()
  plannedTime: number;
}

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  plannedTime?: number;
}
