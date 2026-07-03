import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { TaskRepository } from './repositories/task.repository';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';
import { CategoriesService } from 'src/categories/categories.service';
import {
  InternalServerErrorException,
} from '@nestjs/common';
import {
  TaskNotFoundException,
  WeekPlanNotFoundException,
} from '../common/exceptions/task.exceptions';
import { Priority, TaskStatus } from '@prisma/client';

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

const mockWebsocket = {
  server: { emit: jest.fn() },
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

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: TaskRepository, useValue: mockTaskRepository },
        { provide: WebsocketGateway, useValue: mockWebsocket },
        { provide: CategoriesService, useValue: mockCategoriesService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  describe('getTasksForWeek', () => {
    it('returns tasks for a week', async () => {
      mockTaskRepository.findTasksByWeekPlan.mockResolvedValue([mockTask]);

      const result = await service.getTasksForWeek('week-1');

      expect(result).toEqual([mockTask]);
    });

    it('throws InternalServerErrorException on DB error', async () => {
      mockTaskRepository.findTasksByWeekPlan.mockRejectedValue(
        new Error('db error'),
      );

      await expect(service.getTasksForWeek('week-1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('updateTask', () => {
    it('throws TaskNotFoundException when task does not exist', async () => {
      mockTaskRepository.findTaskById.mockResolvedValue(null);

      await expect(
        service.updateTask('nonexistent', { title: 'Updated' }),
      ).rejects.toThrow(TaskNotFoundException);
    });

    it('updates task and emits websocket event', async () => {
      mockTaskRepository.findTaskById.mockResolvedValue(mockTask);
      mockTaskRepository.updateTask.mockResolvedValue({
        ...mockTask,
        title: 'Updated',
      });

      const result = await service.updateTask('task-1', { title: 'Updated' });

      expect(result.title).toBe('Updated');
      expect(mockWebsocket.server.emit).toHaveBeenCalledWith(
        'taskUpdated',
        expect.any(Object),
      );
    });
  });

  describe('deleteTask', () => {
    it('throws TaskNotFoundException when task does not exist', async () => {
      mockTaskRepository.findTaskById.mockResolvedValue(null);

      await expect(service.deleteTask('nonexistent')).rejects.toThrow(
        TaskNotFoundException,
      );
    });

    it('deletes task and emits websocket event', async () => {
      mockTaskRepository.findTaskById.mockResolvedValue(mockTask);
      mockTaskRepository.deleteTask.mockResolvedValue(mockTask);

      const result = await service.deleteTask('task-1');

      expect(result).toEqual(mockTask);
      expect(mockWebsocket.server.emit).toHaveBeenCalledWith(
        'taskDeleted',
        mockTask,
      );
    });

    it('updates category actual time on delete', async () => {
      const taskWithCategory = { ...mockTask, categoryId: 'cat-1' };
      mockTaskRepository.findTaskById.mockResolvedValue(taskWithCategory);
      mockTaskRepository.deleteTask.mockResolvedValue(taskWithCategory);

      await service.deleteTask('task-1');

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
