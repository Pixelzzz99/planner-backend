import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGoalDto, UpdateGoalDto } from './dto';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async createGoal(userId: string, data: CreateGoalDto) {
    return this.prisma.goal.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async getUserGoals(userId: string) {
    return this.prisma.goal.findMany({
      where: {
        userId: userId,
      },
    });
  }

  async updateGoal(id: string, data: UpdateGoalDto) {
    return this.prisma.goal.update({
      where: { id },
      data,
    });
  }

  async deleteGoal(id: string) {
    return this.prisma.goal.delete({
      where: { id },
    });
  }
}
