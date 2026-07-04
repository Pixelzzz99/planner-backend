import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWeeklyFocusDto } from './dto/create-weekly-focus.dto';
import { UpdateWeeklyFocusDto } from './dto/update-weekly-focus.dto';
import { FocusStatus, Prisma } from '@prisma/client';
import { OwnershipService } from 'src/common/ownership/ownership.service';

const focusInclude = {
  goal: { select: { id: true, title: true } },
} satisfies Prisma.FocusInclude;

@Injectable()
export class WeeklyFocusService {
  constructor(
    private prisma: PrismaService,
    private readonly ownership: OwnershipService,
  ) {}

  private async assertGoalIfProvided(
    goalId: string | null | undefined,
    userId: string,
  ) {
    if (goalId) {
      await this.ownership.assertGoalOwner(goalId, userId);
    }
  }

  async create(weekPlanId: string, userId: string, dto: CreateWeeklyFocusDto) {
    await this.ownership.assertWeekPlanOwner(weekPlanId, userId);
    await this.assertGoalIfProvided(dto.goalId, userId);

    return this.prisma.focus.create({
      data: {
        title: dto.title,
        description: dto.description || '',
        status: dto.status || FocusStatus.IN_PROGRESS,
        weekPlanId,
        goalId: dto.goalId ?? null,
      },
      include: focusInclude,
    });
  }

  async getFocusesByWeekPlanId(weekPlanId: string, userId: string) {
    await this.ownership.assertWeekPlanOwner(weekPlanId, userId);

    return this.prisma.focus.findMany({
      where: { weekPlanId },
      include: focusInclude,
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
    await this.assertGoalIfProvided(dto.goalId, userId);

    const data: Prisma.FocusUpdateInput = {
      title: dto.title,
      description: dto.description,
      status: dto.status,
    };

    if (dto.goalId !== undefined) {
      data.goal = dto.goalId
        ? { connect: { id: dto.goalId } }
        : { disconnect: true };
    }

    return this.prisma.focus.update({
      where: { id: focusId },
      data,
      include: focusInclude,
    });
  }
}
