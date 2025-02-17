import { Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { MonthPlanService } from 'src/month-plan/month-plan.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class YearPlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly monthPlan: MonthPlanService,
  ) {}

  async findOne(userId: string) {
    try {
      return await this.prisma.yearPlan.findMany({
        where: { userId: userId },
        include: {
          months: true,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        console.log(error);
      } else {
        console.log('Unknown error', error);
      }
    }
  }

  async create(userId: string) {
    try {
      const yearPlan = await this.prisma.yearPlan.create({
        data: {
          userId: userId,
          year: new Date().getFullYear(),
        },
      });

      await this.monthPlan.createMonthPlan(yearPlan.id);
      return yearPlan;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        console.log(error);
      } else {
        console.log('Unknown error', error);
      }
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.yearPlan.delete({ where: { id } });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        console.log(error);
      } else {
        console.log('Unknown error', error);
      }
    }
  }
}
