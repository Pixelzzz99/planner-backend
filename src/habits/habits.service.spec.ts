import { Test, TestingModule } from '@nestjs/testing';
import { HabitsService } from './habits.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { OwnershipService } from 'src/common/ownership/ownership.service';
import { NotFoundException } from '@nestjs/common';

const mockHabit = {
  id: 'habit-1',
  userId: 'user-1',
  title: 'Read',
  color: '#10B981',
  createdAt: new Date(),
};

const mockPrisma = {
  habit: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  habitLog: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const mockOwnership = {
  assertUserSelf: jest.fn().mockResolvedValue(undefined),
};

describe('HabitsService', () => {
  let service: HabitsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockOwnership.assertUserSelf.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HabitsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: OwnershipService, useValue: mockOwnership },
      ],
    }).compile();

    service = module.get<HabitsService>(HabitsService);
  });

  it('creates habit', async () => {
    mockPrisma.habit.create.mockResolvedValue(mockHabit);

    const result = await service.createHabit('user-1', { title: 'Read' });

    expect(result).toEqual(mockHabit);
  });

  it('returns habits with logs for week', async () => {
    mockPrisma.habit.findMany.mockResolvedValue([mockHabit]);
    mockPrisma.habitLog.findMany
      .mockResolvedValueOnce([
        {
          id: 'log-1',
          habitId: 'habit-1',
          date: new Date('2026-07-04'),
          completed: true,
        },
      ])
      .mockResolvedValueOnce([
        {
          habitId: 'habit-1',
          date: new Date('2026-07-04'),
        },
      ]);

    const result = await service.getUserHabits('user-1', '2026-07-04');

    expect(result[0].logs).toHaveLength(1);
    expect(result[0].streak).toBeGreaterThanOrEqual(0);
  });

  it('toggles log by creating new entry', async () => {
    mockPrisma.habit.findUnique.mockResolvedValue({ userId: 'user-1' });
    mockPrisma.habitLog.findUnique.mockResolvedValue(null);
    mockPrisma.habitLog.create.mockResolvedValue({
      id: 'log-1',
      habitId: 'habit-1',
      date: new Date('2026-07-04'),
      completed: true,
    });

    const result = await service.toggleLog(
      'habit-1',
      'user-1',
      '2026-07-04',
    );

    expect(result.completed).toBe(true);
  });

  it('returns heatmap for year', async () => {
    mockPrisma.habit.findMany.mockResolvedValue([mockHabit]);
    mockPrisma.habitLog.findMany.mockResolvedValue([
      {
        habitId: 'habit-1',
        date: new Date('2026-03-15'),
      },
    ]);

    const result = await service.getHeatmap('user-1', 2026);

    expect(result.year).toBe(2026);
    expect(result.habits[0].totalCompleted).toBe(1);
    expect(result.habits[0].completedDates).toContain('2026-03-15');
  });

  it('throws when habit not found on update', async () => {
    mockPrisma.habit.findUnique.mockResolvedValue(null);

    await expect(
      service.updateHabit('missing', 'user-1', { title: 'X' }),
    ).rejects.toThrow(NotFoundException);
  });
});
