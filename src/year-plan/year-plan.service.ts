import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { MonthPlanService } from 'src/month-plan/month-plan.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class YearPlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly monthPlan: MonthPlanService,
  ) {}

  async findOne(userId: string) {
    try {
      return await this.prisma.yearPlan.findMany({
        where: { userId },
        include: {
          months: {
            include: { weekPlans: true },
          },
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch year plan');
    }
  }

  async create(userId: string, year?: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const targetYear = year ?? new Date().getFullYear();

    const existing = await this.prisma.yearPlan.findUnique({
      where: { userId_year: { userId, year: targetYear } },
    });
    if (existing) {
      return existing;
    }

    try {
      const yearPlan = await this.prisma.yearPlan.create({
        data: { year: targetYear, userId },
      });
      await this.monthPlan.createMonthPlan(yearPlan.id);
      return yearPlan;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const duplicate = await this.prisma.yearPlan.findUnique({
          where: { userId_year: { userId, year: targetYear } },
        });
        if (duplicate) return duplicate;
      }
      throw new InternalServerErrorException('Failed to create year plan');
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.yearPlan.delete({ where: { id } });
    } catch (error) {
      throw new NotFoundException(`Year plan ${id} not found`);
    }
  }
}
