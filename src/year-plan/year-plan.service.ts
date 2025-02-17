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
          months: {
            include: {
              weekPlans: true,
            },
          },
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
      const existingYearPlan = await this.prisma.yearPlan.findMany({
        where: { userId: userId, year: new Date().getFullYear() },
      });
      if (existingYearPlan.length > 0) {
        return existingYearPlan[0];
      }

      const yearPlan = await this.prisma.yearPlan.create({
        data: {
          year: new Date().getFullYear(),
          user: {
            connect: {
              id: userId,
            },
          },
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
