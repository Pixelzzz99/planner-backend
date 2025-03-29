import { CreateWeeklyFocusDto } from './create-weekly-focus.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateWeeklyFocusDto extends PartialType(CreateWeeklyFocusDto) {
  status?: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
}
