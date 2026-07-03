import { Test, TestingModule } from '@nestjs/testing';
import { YearPlanService } from './year-plan.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MonthPlanService } from 'src/month-plan/month-plan.service';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';

const mockYearPlan = {
  id: 'year-1',
  userId: 'user-1',
  year: 2025,
  months: [],
};

const mockPrisma = {
  user: { findUnique: jest.fn() },
  yearPlan: {
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
};

const mockMonthPlanService = {
  createMonthPlan: jest.fn().mockResolvedValue({}),
};

describe('YearPlanService', () => {
  let service: YearPlanService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YearPlanService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MonthPlanService, useValue: mockMonthPlanService },
      ],
    }).compile();

    service = module.get<YearPlanService>(YearPlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('returns year plans for user', async () => {
      mockPrisma.yearPlan.findMany.mockResolvedValue([mockYearPlan]);

      const result = await service.findOne('user-1');

      expect(result).toEqual([mockYearPlan]);
    });

    it('throws InternalServerErrorException on DB failure', async () => {
      mockPrisma.yearPlan.findMany.mockRejectedValue(new Error('db'));

      await expect(service.findOne('user-1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('create', () => {
    it('throws NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.create('user-1')).rejects.toThrow(NotFoundException);
    });

    it('returns existing year plan if already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      mockPrisma.yearPlan.findMany.mockResolvedValue([mockYearPlan]);

      const result = await service.create('user-1');

      expect(result).toEqual(mockYearPlan);
      expect(mockPrisma.yearPlan.create).not.toHaveBeenCalled();
    });

    it('creates year plan with 12 months for new user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      mockPrisma.yearPlan.findMany.mockResolvedValue([]);
      mockPrisma.yearPlan.create.mockResolvedValue(mockYearPlan);

      const result = await service.create('user-1');

      expect(result).toEqual(mockYearPlan);
      expect(mockMonthPlanService.createMonthPlan).toHaveBeenCalledWith(
        'year-1',
      );
    });
  });
});
