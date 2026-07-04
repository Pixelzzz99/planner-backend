import { Test, TestingModule } from '@nestjs/testing';
import { WeekPlanService } from './week-plan.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { OwnershipService } from 'src/common/ownership/ownership.service';

const mockWeekPlan = {
  id: 'week-1',
  monthPlanId: 'month-1',
  startDate: new Date('2025-01-06'),
  endDate: new Date('2025-01-12'),
  tasks: [],
  focus: [],
};

const mockPrisma = {
  weekPlan: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const mockOwnership = {
  assertMonthPlanOwner: jest.fn().mockResolvedValue(undefined),
  assertWeekPlanOwner: jest.fn().mockResolvedValue(undefined),
};

describe('WeekPlanService', () => {
  let service: WeekPlanService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockOwnership.assertMonthPlanOwner.mockResolvedValue(undefined);
    mockOwnership.assertWeekPlanOwner.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeekPlanService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: OwnershipService, useValue: mockOwnership },
      ],
    }).compile();

    service = module.get<WeekPlanService>(WeekPlanService);
  });

  describe('createWeekPlan', () => {
    it('creates and returns week plan', async () => {
      mockPrisma.weekPlan.create.mockResolvedValue(mockWeekPlan);

      const result = await service.createWeekPlan('month-1', 'user-1', {
        startDate: '2025-01-06',
        endDate: '2025-01-12',
      });

      expect(result).toEqual(mockWeekPlan);
      expect(mockPrisma.weekPlan.create).toHaveBeenCalledWith({
        data: {
          startDate: new Date('2025-01-06'),
          endDate: new Date('2025-01-12'),
          monthPlanId: 'month-1',
        },
      });
    });

    it('throws InternalServerErrorException on unexpected error', async () => {
      mockPrisma.weekPlan.create.mockRejectedValue(new Error('unexpected'));

      await expect(
        service.createWeekPlan('month-1', 'user-1', {
          startDate: '2025-01-06',
          endDate: '2025-01-12',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getWeekPlans', () => {
    it('returns week plan with tasks and focus', async () => {
      mockPrisma.weekPlan.findUnique.mockResolvedValue(mockWeekPlan);

      const result = await service.getWeekPlans('week-1', 'user-1');

      expect(result).toEqual(mockWeekPlan);
    });

    it('throws NotFoundException when week plan not found', async () => {
      mockOwnership.assertWeekPlanOwner.mockRejectedValue(
        new NotFoundException('Week plan not found'),
      );

      await expect(service.getWeekPlans('nonexistent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteWeekPlan', () => {
    it('deletes and returns week plan', async () => {
      mockPrisma.weekPlan.delete.mockResolvedValue(mockWeekPlan);

      const result = await service.deleteWeekPlan('week-1', 'user-1');

      expect(result).toEqual(mockWeekPlan);
    });
  });
});
