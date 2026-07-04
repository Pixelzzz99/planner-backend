import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWeekPlanDto } from './dto/create-week.dto';
import { UpdateWeekPlanDto } from './dto/update-week.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { OwnershipService } from 'src/common/ownership/ownership.service';

@Injectable()
export class WeekPlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: OwnershipService,
  ) {}

  async createWeekPlan(
    monthPlanId: string,
    userId: string,
    data: CreateWeekPlanDto,
  ) {
    await this.ownership.assertMonthPlanOwner(monthPlanId, userId);
    try {
      return await this.prisma.weekPlan.create({
        data: {
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          monthPlanId,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new BadRequestException(error.meta?.target as string);
      }
      throw new InternalServerErrorException('Failed to create week plan');
    }
  }

  async getWeekPlans(weekPlanId: string, userId: string) {
    try {
      await this.ownership.assertWeekPlanOwner(weekPlanId, userId);

      const week = await this.prisma.weekPlan.findUnique({
        where: { id: weekPlanId },
        include: {
          tasks: {
            where: { isArchived: false },
            include: { category: true },
            orderBy: { position: 'asc' },
          },
          focus: true,
        },
      });

      if (!week) {
        throw new NotFoundException(`Week plan ${weekPlanId} not found`);
      }

      return week;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to fetch week plan');
    }
  }

  async updateWeekPlan(id: string, data: UpdateWeekPlanDto) {
    try {
      return await this.prisma.weekPlan.update({ where: { id }, data });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new NotFoundException(`Week plan ${id} not found`);
      }
      throw new InternalServerErrorException('Failed to update week plan');
    }
  }

  async deleteWeekPlan(id: string, userId: string) {
    try {
      await this.ownership.assertWeekPlanOwner(id, userId);
      return await this.prisma.weekPlan.delete({ where: { id } });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new NotFoundException(`Week plan ${id} not found`);
      }
      throw new InternalServerErrorException('Failed to delete week plan');
    }
  }
}
