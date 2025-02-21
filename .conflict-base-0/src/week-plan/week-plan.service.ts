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
      return await this.prisma.weekPlan.create({
        data: {
          ...data,
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

  async getWeekPlans(monthPlanId: string) {
    try {
      return await this.prisma.weekPlan.findMany({
        where: { monthPlanId },
        include: {
          tasks: true,
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
