import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
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

  async create(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.yearPlan.findMany({
      where: { userId, year: new Date().getFullYear() },
    });
    if (existing.length > 0) {
      return existing[0];
    }

    try {
      const yearPlan = await this.prisma.yearPlan.create({
        data: { year: new Date().getFullYear(), userId },
      });
      await this.monthPlan.createMonthPlan(yearPlan.id);
      return yearPlan;
    } catch (error) {
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
