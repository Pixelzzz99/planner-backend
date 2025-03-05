import { Test, TestingModule } from '@nestjs/testing';
import { YearPlanService } from './year-plan.service';

describe('YearPlanService', () => {
  let service: YearPlanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [YearPlanService],
    }).compile();

    service = module.get<YearPlanService>(YearPlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
