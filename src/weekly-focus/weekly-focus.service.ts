import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWeeklyFocusDto } from './dto/create-weekly-focus.dto';
import { UpdateWeeklyFocusDto } from './dto/update-weekly-focus.dto';

@Injectable()
export class WeeklyFocusService {
  constructor(private prisma: PrismaService) {}

  async create(weekPlanId: string, dto: CreateWeeklyFocusDto) {
    // Проверяем существование weekPlan
    const weekPlan = await this.prisma.weekPlan.findUnique({
      where: { id: weekPlanId },
    });

    if (!weekPlan) {
      throw new NotFoundException('Week plan not found');
    }

    return this.prisma.focus.create({
      data: {
        title: dto.title,
        description: dto.description || '',
        weekPlanId: weekPlanId,
      },
    });
  }

  async getFocusesByWeekPlanId(weekPlanId: string) {
    const weekPlan = await this.prisma.weekPlan.findUnique({
      where: { id: weekPlanId },
      include: { focus: true },
    });

    if (!weekPlan) {
      throw new NotFoundException('Week plan not found');
    }

    return weekPlan.focus;
  }

  async delete(focusId: string) {
    const focus = await this.prisma.focus.findUnique({
      where: { id: focusId },
    });

    if (!focus) {
      throw new NotFoundException('Focus not found');
    }

    return this.prisma.focus.delete({
      where: { id: focusId },
    });
  }

  async update(focusId: string, dto: UpdateWeeklyFocusDto) {
    const focus = await this.prisma.focus.findUnique({
      where: { id: focusId },
    });

    if (!focus) {
      throw new NotFoundException('Focus not found');
    }

    return this.prisma.focus.update({
      where: { id: focusId },
      data: {
        title: dto.title,
        description: dto.description,
      },
    });
  }
}
