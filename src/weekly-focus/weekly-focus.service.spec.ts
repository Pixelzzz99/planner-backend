import { Test, TestingModule } from '@nestjs/testing';
import { WeeklyFocusService } from './weekly-focus.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('WeeklyFocusService', () => {
  let service: WeeklyFocusService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    weekPlan: {
      findUnique: jest.fn(),
    },
    focus: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeeklyFocusService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<WeeklyFocusService>(WeeklyFocusService);
    prismaService = module.get<PrismaService>(PrismaService);
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

      mockPrismaService.weekPlan.findUnique.mockResolvedValue(mockWeekPlan);
      mockPrismaService.focus.create.mockResolvedValue(expectedFocus);

      const result = await service.create(mockWeekPlan.id, createDto);

      expect(result).toEqual(expectedFocus);
    });

    it('should throw NotFoundException if week plan not found', async () => {
      mockPrismaService.weekPlan.findUnique.mockResolvedValue(null);

      await expect(
        service.create('non-existent-id', {
          title: 'Test',
          description: 'Test',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFocusesByWeekPlanId', () => {
    it('should return focuses for week plan', async () => {
      const mockWeekPlan = {
        id: 'week-plan-uuid',
        focus: [
          {
            id: 'focus-uuid',
            title: 'Test Focus',
            description: 'Test Description',
          },
        ],
      };

      mockPrismaService.weekPlan.findUnique.mockResolvedValue(mockWeekPlan);

      const result = await service.getFocusesByWeekPlanId(mockWeekPlan.id);

      expect(result).toEqual(mockWeekPlan.focus);
    });
  });

  // Добавьте больше тестов для других методов сервиса
});
