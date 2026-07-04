import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { TaskRepository } from './repositories/task.repository';
import { CategoriesService } from 'src/categories/categories.service';
import {
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  WeekPlanNotFoundException,
} from '../common/exceptions/task.exceptions';
import { Priority, TaskStatus } from '@prisma/client';
import { OwnershipService } from 'src/common/ownership/ownership.service';

const mockTask = {
  id: 'task-1',
  weekPlanId: 'week-1',
  title: 'Test Task',
  description: null,
  priority: Priority.MEDIUM,
  duration: 60,
  day: 1,
  date: new Date(),
  categoryId: null,
  category: null,
  status: TaskStatus.TODO,
  isArchived: false,
  archiveReason: null,
  archivedAt: null,
  position: 1000,
  createdAt: new Date(),
};

const mockCategoriesService = {
  updateActualTime: jest.fn(),
};

const mockTaskRepository = {
  findTasksByWeekPlan: jest.fn(),
  findLastPosition: jest.fn().mockResolvedValue(1000),
  createTask: jest.fn(),
  findTaskById: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  findArchivedTasks: jest.fn(),
  findAllNonArchivedTasks: jest.fn(),
  transaction: jest.fn((fn) => fn({ task: { findMany: jest.fn(), update: jest.fn() } })),
};

const mockOwnership = {
  assertWeekPlanOwner: jest.fn().mockResolvedValue(undefined),
  assertTaskOwner: jest.fn().mockResolvedValue(undefined),
  assertCategoryOwner: jest.fn().mockResolvedValue(undefined),
};

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockOwnership.assertWeekPlanOwner.mockResolvedValue(undefined);
    mockOwnership.assertTaskOwner.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: TaskRepository, useValue: mockTaskRepository },
        { provide: CategoriesService, useValue: mockCategoriesService },
        { provide: OwnershipService, useValue: mockOwnership },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  describe('getTasksForWeek', () => {
    it('returns tasks for a week', async () => {
      mockTaskRepository.findTasksByWeekPlan.mockResolvedValue([mockTask]);

      const result = await service.getTasksForWeek('week-1', 'user-1');

      expect(result).toEqual([mockTask]);
    });

    it('throws InternalServerErrorException on DB error', async () => {
      mockTaskRepository.findTasksByWeekPlan.mockRejectedValue(
        new Error('db error'),
      );

      await expect(service.getTasksForWeek('week-1', 'user-1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('updateTask', () => {
    it('throws NotFoundException when task owner check fails', async () => {
      mockOwnership.assertTaskOwner.mockRejectedValue(
        new NotFoundException('Task not found'),
      );

      await expect(
        service.updateTask('nonexistent', 'user-1', { title: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates task', async () => {
      mockTaskRepository.findTaskById.mockResolvedValue(mockTask);
      mockTaskRepository.updateTask.mockResolvedValue({
        ...mockTask,
        title: 'Updated',
      });

      const result = await service.updateTask('task-1', 'user-1', {
        title: 'Updated',
      });

      expect(result.title).toBe('Updated');
    });

    it('checks week plan ownership when moving task', async () => {
      mockTaskRepository.findTaskById.mockResolvedValue(mockTask);
      mockTaskRepository.updateTask.mockResolvedValue(mockTask);
      mockOwnership.assertWeekPlanOwner.mockRejectedValue(
        new ForbiddenException('Access denied'),
      );

      await expect(
        service.updateTask('task-1', 'user-1', { weekPlanId: 'other-week' }),
      ).rejects.toThrow(ForbiddenException);

      expect(mockOwnership.assertWeekPlanOwner).toHaveBeenCalledWith(
        'other-week',
        'user-1',
      );
    });

    it('checks category ownership when changing category', async () => {
      mockTaskRepository.findTaskById.mockResolvedValue(mockTask);
      mockTaskRepository.updateTask.mockResolvedValue(mockTask);
      mockOwnership.assertCategoryOwner.mockRejectedValue(
        new ForbiddenException('Access denied'),
      );

      await expect(
        service.updateTask('task-1', 'user-1', { categoryId: 'other-cat' }),
      ).rejects.toThrow(ForbiddenException);

      expect(mockOwnership.assertCategoryOwner).toHaveBeenCalledWith(
        'other-cat',
        'user-1',
      );
    });
  });

  describe('deleteTask', () => {
    it('throws NotFoundException when task owner check fails', async () => {
      mockOwnership.assertTaskOwner.mockRejectedValue(
        new NotFoundException('Task not found'),
      );

      await expect(service.deleteTask('nonexistent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deletes task', async () => {
      mockTaskRepository.findTaskById.mockResolvedValue(mockTask);
      mockTaskRepository.deleteTask.mockResolvedValue(mockTask);

      const result = await service.deleteTask('task-1', 'user-1');

      expect(result).toEqual(mockTask);
    });

    it('updates category actual time on delete', async () => {
      const taskWithCategory = { ...mockTask, categoryId: 'cat-1' };
      mockTaskRepository.findTaskById.mockResolvedValue(taskWithCategory);
      mockTaskRepository.deleteTask.mockResolvedValue(taskWithCategory);

      await service.deleteTask('task-1', 'user-1');

      expect(mockCategoriesService.updateActualTime).toHaveBeenCalledWith(
        'cat-1',
      );
    });
  });

  describe('getArchivedTasks', () => {
    it('returns archived tasks for user', async () => {
      const archived = [{ ...mockTask, isArchived: true }];
      mockTaskRepository.findArchivedTasks.mockResolvedValue(archived);

      const result = await service.getArchivedTasks('user-1');

      expect(result).toEqual(archived);
      expect(mockTaskRepository.findArchivedTasks).toHaveBeenCalledWith(
        'user-1',
      );
    });

    it('throws InternalServerErrorException on failure', async () => {
      mockTaskRepository.findArchivedTasks.mockRejectedValue(
        new Error('db error'),
      );

      await expect(service.getArchivedTasks('user-1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
