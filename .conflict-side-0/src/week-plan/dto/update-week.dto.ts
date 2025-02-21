import { CreateWeekPlanDto } from './create-week.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateWeekPlanDto extends PartialType(CreateWeekPlanDto) {}
