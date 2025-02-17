import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWeekPlanDto } from './dto/create-week.dto';
import { UpdateWeekPlanDto } from './dto/update-week.dto';

@Injectable()
export class WeekPlanService {
  constructor(private readonly prisma: PrismaService) {}

  async createWeekPlan(monthPlanId: string, data: CreateWeekPlanDto) {
    return await this.prisma.weekPlan.create({
      data: {
        ...data,
        monthPlanId,
      },
    });
  }

  async getWeekPlans(monthPlanId: string) {
    return await this.prisma.weekPlan.findMany({
      where: { monthPlanId },
      include: {
        tasks: true,
        focus: true,
      },
    });
  }

  async updateWeekPlan(id: string, data: UpdateWeekPlanDto) {
    return await this.prisma.weekPlan.update({
      where: { id },
      data,
    });
  }

  async deleteWeekPlan(id: string) {
    return await this.prisma.weekPlan.delete({
      where: { id },
    });
  }
}
