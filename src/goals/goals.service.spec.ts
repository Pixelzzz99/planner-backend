import { Test, TestingModule } from '@nestjs/testing';
import { GoalsService } from './goals.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { GoalStatus } from '@prisma/client';
import { OwnershipService } from 'src/common/ownership/ownership.service';

const mockUser = { id: 'user-1', email: 'a@b.com', name: 'A' };
const mockGoal = {
  id: 'goal-1',
  userId: 'user-1',
  title: 'Learn NestJS',
  status: GoalStatus.TODO,
  year: 2026,
  createdAt: new Date(),
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  goal: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  focus: {
    findMany: jest.fn().mockResolvedValue([]),
  },
};

const mockOwnership = {
  assertGoalOwner: jest.fn(),
};

describe('GoalsService', () => {
  let service: GoalsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: OwnershipService, useValue: mockOwnership },
      ],
    }).compile();

    service = module.get<GoalsService>(GoalsService);
  });

  describe('createGoal', () => {
    it('throws NotFoundException if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createGoal('user-1', { title: 'Goal' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates and returns goal', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.goal.create.mockResolvedValue(mockGoal);

      const result = await service.createGoal('user-1', { title: 'Learn NestJS' });

      expect(result).toEqual({
        ...mockGoal,
        linkedFocusesTotal: 0,
        linkedFocusesCompleted: 0,
        focusProgress: null,
      });
      expect(mockPrisma.goal.create).toHaveBeenCalledWith({
        data: {
          title: 'Learn NestJS',
          userId: 'user-1',
          year: expect.any(Number),
        },
      });
    });
  });

  describe('getUserGoals', () => {
    it('throws if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserGoals('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns goals list', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.goal.findMany.mockResolvedValue([mockGoal]);

      const result = await service.getUserGoals('user-1');

      expect(result).toEqual([
        {
          ...mockGoal,
          linkedFocusesTotal: 0,
          linkedFocusesCompleted: 0,
          focusProgress: null,
        },
      ]);
    });
  });

  describe('updateGoal', () => {
    it('throws if goal not found', async () => {
      mockOwnership.assertGoalOwner.mockRejectedValue(
        new NotFoundException('Goal not found'),
      );

      await expect(
        service.updateGoal('goal-1', 'user-1', { status: GoalStatus.COMPLETED }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates and returns goal', async () => {
      mockOwnership.assertGoalOwner.mockResolvedValue(undefined);
      mockPrisma.goal.update.mockResolvedValue({
        ...mockGoal,
        status: GoalStatus.COMPLETED,
      });

      const result = await service.updateGoal('goal-1', 'user-1', {
        status: GoalStatus.COMPLETED,
      });

      expect(result).toMatchObject({
        status: GoalStatus.COMPLETED,
        linkedFocusesTotal: 0,
        linkedFocusesCompleted: 0,
        focusProgress: null,
      });
    });
  });

  describe('deleteGoal', () => {
    it('deletes and returns goal', async () => {
      mockOwnership.assertGoalOwner.mockResolvedValue(undefined);
      mockPrisma.goal.delete.mockResolvedValue(mockGoal);

      const result = await service.deleteGoal('goal-1', 'user-1');

      expect(result).toEqual(mockGoal);
      expect(mockPrisma.goal.delete).toHaveBeenCalledWith({
        where: { id: 'goal-1' },
      });
    });
  });
});
