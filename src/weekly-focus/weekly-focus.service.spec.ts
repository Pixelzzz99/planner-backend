import { Test, TestingModule } from '@nestjs/testing';
import { WeeklyFocusService } from './weekly-focus.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { OwnershipService } from 'src/common/ownership/ownership.service';

describe('WeeklyFocusService', () => {
  let service: WeeklyFocusService;

  const mockPrismaService = {
    weekPlan: {
      findUnique: jest.fn(),
    },
    focus: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockOwnership = {
    assertWeekPlanOwner: jest.fn().mockResolvedValue(undefined),
    assertFocusOwner: jest.fn().mockResolvedValue(undefined),
    assertGoalOwner: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockOwnership.assertWeekPlanOwner.mockResolvedValue(undefined);
    mockOwnership.assertFocusOwner.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeeklyFocusService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: OwnershipService, useValue: mockOwnership },
      ],
    }).compile();

    service = module.get<WeeklyFocusService>(WeeklyFocusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a focus', async () => {
      const mockWeekPlan = {
        id: 'week-plan-uuid',
        monthPlanId: 'month-plan-uuid',
        startDate: new Date(),
        endDate: new Date(),
      };

      const createDto = {
        title: 'Test Focus',
        description: 'Test Description',
      };

      const expectedFocus = {
        id: 'focus-uuid',
        weekPlanId: mockWeekPlan.id,
        ...createDto,
      };

      mockPrismaService.focus.create.mockResolvedValue(expectedFocus);

      const result = await service.create(
        mockWeekPlan.id,
        'user-1',
        createDto,
      );

      expect(result).toEqual(expectedFocus);
    });

    it('should throw NotFoundException if week plan not found', async () => {
      mockOwnership.assertWeekPlanOwner.mockRejectedValue(
        new NotFoundException('Week plan not found'),
      );

      await expect(
        service.create('non-existent-id', 'user-1', {
          title: 'Test',
          description: 'Test',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFocusesByWeekPlanId', () => {
    it('should return focuses for week plan', async () => {
      const mockFocuses = [
        {
          id: 'focus-uuid',
          title: 'Test Focus',
          description: 'Test Description',
        },
      ];

      mockPrismaService.focus.findMany.mockResolvedValue(mockFocuses);

      const result = await service.getFocusesByWeekPlanId(
        'week-plan-uuid',
        'user-1',
      );

      expect(result).toEqual(mockFocuses);
    });
  });
});
