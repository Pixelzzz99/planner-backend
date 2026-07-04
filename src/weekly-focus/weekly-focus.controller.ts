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
import { GetUser } from 'src/auth/get-user.decorator';

@Controller('weekly-focus')
@UseGuards(AuthGuard('jwt'))
export class WeeklyFocusController {
  constructor(private readonly weeklyFocusService: WeeklyFocusService) {}

  @Post('week/:weekPlanId')
  create(
    @Param('weekPlanId') weekPlanId: string,
    @Body() dto: CreateWeeklyFocusDto,
    @GetUser('userId') userId: string,
  ) {
    return this.weeklyFocusService.create(weekPlanId, userId, dto);
  }

  @Get('week/:weekPlanId')
  getFocuses(
    @Param('weekPlanId') weekPlanId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.weeklyFocusService.getFocusesByWeekPlanId(weekPlanId, userId);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @GetUser('userId') userId: string) {
    return this.weeklyFocusService.delete(id, userId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWeeklyFocusDto,
    @GetUser('userId') userId: string,
  ) {
    return this.weeklyFocusService.update(id, userId, dto);
  }
}
