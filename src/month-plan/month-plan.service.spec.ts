import { Test, TestingModule } from '@nestjs/testing';
import { MonthPlanService } from './month-plan.service';
import { PrismaService } from 'src/prisma/prisma.service';

const mockPrisma = {
  monthPlan: {
    findMany: jest.fn(),
    createMany: jest.fn(),
  },
};

describe('MonthPlanService', () => {
  let service: MonthPlanService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonthPlanService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MonthPlanService>(MonthPlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMonthPlan', () => {
    it('creates 12 months for a year', async () => {
      mockPrisma.monthPlan.createMany.mockResolvedValue({ count: 12 });

      await service.createMonthPlan('year-1');

      expect(mockPrisma.monthPlan.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          { yearPlanId: 'year-1', month: 1 },
          { yearPlanId: 'year-1', month: 12 },
        ]),
      });

      const call = mockPrisma.monthPlan.createMany.mock.calls[0][0];
      expect(call.data).toHaveLength(12);
    });
  });
});
