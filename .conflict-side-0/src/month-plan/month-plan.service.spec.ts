import { Test, TestingModule } from '@nestjs/testing';
import { MonthPlanService } from './month-plan.service';

describe('MonthPlanService', () => {
  let service: MonthPlanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MonthPlanService],
    }).compile();

    service = module.get<MonthPlanService>(MonthPlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
