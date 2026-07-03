import { Test, TestingModule } from '@nestjs/testing';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';
import { GoalStatus } from '@prisma/client';

const mockGoal = {
  id: 'goal-1',
  userId: 'user-1',
  title: 'Learn NestJS',
  status: GoalStatus.TODO,
  createdAt: new Date(),
};

const mockGoalsService = {
  createGoal: jest.fn().mockResolvedValue(mockGoal),
  getUserGoals: jest.fn().mockResolvedValue([mockGoal]),
  updateGoal: jest.fn().mockResolvedValue({ ...mockGoal, status: GoalStatus.COMPLETED }),
  deleteGoal: jest.fn().mockResolvedValue(mockGoal),
};

describe('GoalsController', () => {
  let controller: GoalsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoalsController],
      providers: [{ provide: GoalsService, useValue: mockGoalsService }],
    }).compile();

    controller = module.get<GoalsController>(GoalsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create delegates to service', async () => {
    const result = await controller.create('user-1', { title: 'Learn NestJS' });
    expect(result).toEqual(mockGoal);
  });

  it('getUserGoals returns goals list', async () => {
    const result = await controller.getUserGoals('user-1');
    expect(result).toEqual([mockGoal]);
  });
});
