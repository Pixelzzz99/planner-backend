import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class MonthPlanService {
  constructor(private readonly prisma: PrismaService) {}

  async findYearMonth(yearId: string) {
    try {
      return await this.prisma.monthPlan.findMany({
        where: { yearPlanId: yearId },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        console.log(error);
      } else {
        console.log('Unknown error', error);
      }
    }
  }

  async createMonthPlan(yearId: string) {
    try {
      const months = Array.from({ length: 12 }, (_, i) => i + 1);
      return await this.prisma.monthPlan.createMany({
        data: months.map((month) => ({
          yearPlanId: yearId,
          month,
        })),
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        console.log(error);
      } else {
        console.log('Unknown error', error);
      }
    }
  }
}
