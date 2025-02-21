import { Test, TestingModule } from '@nestjs/testing';
import { YearPlanController } from './year-plan.controller';

describe('YearPlanController', () => {
  let controller: YearPlanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [YearPlanController],
    }).compile();

    controller = module.get<YearPlanController>(YearPlanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
