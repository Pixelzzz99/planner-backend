import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGoalDto, UpdateGoalDto } from './dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async createGoal(userId: string, data: CreateGoalDto) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return await this.prisma.goal.create({
        data: {
          ...data,
          userId,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new NotFoundException('User not found');
      } else {
        throw error;
      }
    }
  }

  async getUserGoals(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      return await this.prisma.goal.findMany({
        where: {
          userId,
        },
      });
    } catch (error) {
      console.error('Error fetching user goals:', error);
      if (error instanceof PrismaClientKnownRequestError) {
        throw new NotFoundException('User not found');
      } else {
        throw error;
      }
    }
  }

  async updateGoal(id: string, data: UpdateGoalDto) {
    try {
      return await this.prisma.goal.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error('Error updating goal:', error);
      if (error instanceof PrismaClientKnownRequestError) {
        throw new NotFoundException('Goal not found');
      } else {
        throw error;
      }
    }
  }

  async deleteGoal(id: string) {
    try {
      return await this.prisma.goal.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting goal:', error);
      if (error instanceof PrismaClientKnownRequestError) {
        throw new NotFoundException('Goal not found');
      } else {
        throw error;
      }
    }
  }
}
