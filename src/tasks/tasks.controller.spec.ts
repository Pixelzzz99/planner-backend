import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Priority, TaskStatus } from '@prisma/client';

const mockTask = {
  id: 'task-1',
  weekPlanId: 'week-1',
  title: 'Test',
  priority: Priority.MEDIUM,
  duration: 60,
  day: 1,
  date: new Date(),
  status: TaskStatus.TODO,
  isArchived: false,
  position: 1000,
};

const mockTasksService = {
  getArchivedTasks: jest.fn().mockResolvedValue([]),
  getTasksForWeek: jest.fn().mockResolvedValue([mockTask]),
  createTask: jest.fn().mockResolvedValue(mockTask),
  updateTask: jest.fn().mockResolvedValue(mockTask),
  moveTask: jest.fn().mockResolvedValue(mockTask),
  deleteTask: jest.fn().mockResolvedValue(mockTask),
  fixAllPositions: jest.fn().mockResolvedValue({ message: 'fixed' }),
};

describe('TasksController', () => {
  let controller: TasksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [{ provide: TasksService, useValue: mockTasksService }],
    }).compile();

    controller = module.get<TasksController>(TasksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getArchivedTasks delegates to service', async () => {
    const result = await controller.getArchivedTasks('user-1');
    expect(result).toEqual([]);
    expect(mockTasksService.getArchivedTasks).toHaveBeenCalledWith('user-1');
  });

  it('getTasksForWeek delegates to service', async () => {
    const result = await controller.getTasksForWeek('week-1');
    expect(result).toEqual([mockTask]);
  });

  it('deleteTask delegates to service', async () => {
    const result = await controller.deleteTask('task-1');
    expect(result).toEqual(mockTask);
  });
});
