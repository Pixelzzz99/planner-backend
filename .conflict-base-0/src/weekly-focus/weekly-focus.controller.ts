import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Delete,
  Put,
} from '@nestjs/common';
import { WeeklyFocusService } from './weekly-focus.service';
import { CreateWeeklyFocusDto } from './dto/create-weekly-focus.dto';
import { AuthGuard } from '@nestjs/passport';
import { UpdateWeeklyFocusDto } from './dto/update-weekly-focus.dto';

@Controller('weekly-focus')
@UseGuards(AuthGuard('jwt'))
export class WeeklyFocusController {
  constructor(private readonly weeklyFocusService: WeeklyFocusService) {}

  @Post('week/:weekPlanId')
  create(
    @Param('weekPlanId') weekPlanId: string,
    @Body() dto: CreateWeeklyFocusDto,
  ) {
    return this.weeklyFocusService.create(weekPlanId, dto);
  }

  @Get('week/:weekPlanId')
  getFocuses(@Param('weekPlanId') weekPlanId: string) {
    return this.weeklyFocusService.getFocusesByWeekPlanId(weekPlanId);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.weeklyFocusService.delete(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWeeklyFocusDto) {
    return this.weeklyFocusService.update(id, dto);
  }
}
