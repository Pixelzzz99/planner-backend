import { Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class YearPlanService {
  constructor(private readonly prisma: PrismaService) {}

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
      return await this.prisma.yearPlan.create({
        data: {
          userId: userId,
          year: new Date().getFullYear(),
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
