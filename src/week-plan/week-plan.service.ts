import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWeekPlanDto } from './dto/create-week.dto';
import { UpdateWeekPlanDto } from './dto/update-week.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class WeekPlanService {
  constructor(private readonly prisma: PrismaService) {}

  async createWeekPlan(monthPlanId: string, data: CreateWeekPlanDto) {
    try {
      const formattedData = {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      };
      return await this.prisma.weekPlan.create({
        data: {
          ...formattedData,
          monthPlanId,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        console.log(error);
        throw new Error(error.meta?.target as string);
      }
      console.log('Unknown error', error);
      throw new Error('Unknown error');
    }
  }

  async getWeekPlans(weekPlanId: string) {
    try {
      return await this.prisma.weekPlan.findUnique({
        where: { id: weekPlanId },
        include: {
          tasks: {
            where: {
              isArchived: false,
            },
            include: {
              category: true,
            },
            orderBy: {
              position: 'asc',
            },
          },
          focus: true,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        console.log(error);
        throw new Error(error.meta?.target as string);
      }
      console.log('Unknown error', error);
      throw new Error('Unknown error');
    }
  }

  async updateWeekPlan(id: string, data: UpdateWeekPlanDto) {
    try {
      return await this.prisma.weekPlan.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        console.log(error);
        throw new Error(error.meta?.target as string);
      }
      console.log('Unknown error', error);
      throw new Error('Unknown error');
    }
  }

  async deleteWeekPlan(id: string) {
    try {
      return await this.prisma.weekPlan.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        console.log(error);
        throw new Error(error.meta?.target as string);
      }
      console.log('Unknown error', error);
      throw new Error('Unknown error');
    }
  }
}
