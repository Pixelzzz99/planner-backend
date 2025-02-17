import { Test, TestingModule } from '@nestjs/testing';
import { WeekPlanService } from './week-plan.service';

describe('WeekPlanService', () => {
  let service: WeekPlanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WeekPlanService],
    }).compile();

    service = module.get<WeekPlanService>(WeekPlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
