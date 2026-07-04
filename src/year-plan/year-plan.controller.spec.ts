import { Test, TestingModule } from '@nestjs/testing';
import { YearPlanController } from './year-plan.controller';
import { YearPlanService } from './year-plan.service';

const mockYearPlan = { id: 'year-1', userId: 'user-1', year: 2025, months: [] };

const mockYearPlanService = {
  create: jest.fn().mockResolvedValue(mockYearPlan),
  findOne: jest.fn().mockResolvedValue([mockYearPlan]),
  remove: jest.fn().mockResolvedValue(mockYearPlan),
};

describe('YearPlanController', () => {
  let controller: YearPlanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [YearPlanController],
      providers: [{ provide: YearPlanService, useValue: mockYearPlanService }],
    }).compile();

    controller = module.get<YearPlanController>(YearPlanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getUserYearPlan returns year plans', async () => {
    const result = await controller.getUserYearPlan('user-1');
    expect(mockYearPlanService.findOne).toHaveBeenCalledWith('user-1');
    expect(result).toEqual([mockYearPlan]);
  });
});
