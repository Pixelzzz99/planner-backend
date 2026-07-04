import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { YearPlanService } from './year-plan.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/get-user.decorator';

@Controller('year-plan')
@UseGuards(AuthGuard('jwt'))
export class YearPlanController {
  constructor(private readonly yearPlanService: YearPlanService) {}

  @Post()
  create(
    @GetUser('userId') userId: string,
    @Body() data: { year?: number },
  ) {
    return this.yearPlanService.create(userId, data?.year);
  }

  @Get()
  getUserYearPlan(@GetUser('userId') userId: string) {
    return this.yearPlanService.findOne(userId);
  }
}
