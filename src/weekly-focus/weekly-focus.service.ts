import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWeeklyFocusDto } from './dto/create-weekly-focus.dto';
import { UpdateWeeklyFocusDto } from './dto/update-weekly-focus.dto';
import { FocusStatus } from '@prisma/client';
import { OwnershipService } from 'src/common/ownership/ownership.service';

@Injectable()
export class WeeklyFocusService {
  constructor(
    private prisma: PrismaService,
    private readonly ownership: OwnershipService,
  ) {}

  async create(weekPlanId: string, userId: string, dto: CreateWeeklyFocusDto) {
    await this.ownership.assertWeekPlanOwner(weekPlanId, userId);

    return this.prisma.focus.create({
      data: {
        title: dto.title,
        description: dto.description || '',
        status: dto.status || FocusStatus.IN_PROGRESS,
        weekPlanId: weekPlanId,
      },
    });
  }

  async getFocusesByWeekPlanId(weekPlanId: string, userId: string) {
    await this.ownership.assertWeekPlanOwner(weekPlanId, userId);

    return this.prisma.focus.findMany({
      where: { weekPlanId },
    });
  }

  async delete(focusId: string, userId: string) {
    await this.ownership.assertFocusOwner(focusId, userId);

    return this.prisma.focus.delete({
      where: { id: focusId },
    });
  }

  async update(focusId: string, userId: string, dto: UpdateWeeklyFocusDto) {
    await this.ownership.assertFocusOwner(focusId, userId);

    return this.prisma.focus.update({
      where: { id: focusId },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
      },
    });
  }
}
