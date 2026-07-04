import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { CategoryRepository } from './category.repository';
import { OwnershipService } from 'src/common/ownership/ownership.service';

const mockCategory = {
  id: 'cat-1',
  userId: 'user-1',
  name: 'Work',
  plannedTime: 120,
  actualTime: 60,
  createdAt: new Date(),
  tasks: [],
};

const mockCategoryRepository = {
  create: jest.fn(),
  findManyByUserId: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  calculateAndUpdateActualTime: jest.fn(),
};

const mockOwnership = {
  assertCategoryOwner: jest.fn().mockResolvedValue(undefined),
};

describe('CategoriesService', () => {
  let service: CategoriesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockOwnership.assertCategoryOwner.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: CategoryRepository, useValue: mockCategoryRepository },
        { provide: OwnershipService, useValue: mockOwnership },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  describe('createCategory', () => {
    it('delegates to repository', async () => {
      mockCategoryRepository.create.mockResolvedValue(mockCategory);

      const result = await service.createCategory('user-1', {
        name: 'Work',
        plannedTime: 120,
      });

      expect(result).toEqual(mockCategory);
      expect(mockCategoryRepository.create).toHaveBeenCalledWith('user-1', {
        name: 'Work',
        plannedTime: 120,
      });
    });
  });

  describe('getUserCategories', () => {
    it('returns categories for user', async () => {
      mockCategoryRepository.findManyByUserId.mockResolvedValue([mockCategory]);

      const result = await service.getUserCategories('user-1');

      expect(result).toEqual([mockCategory]);
    });
  });

  describe('updateCategory', () => {
    it('delegates update to repository', async () => {
      mockCategoryRepository.update.mockResolvedValue({
        ...mockCategory,
        plannedTime: 200,
      });

      const result = await service.updateCategory('cat-1', 'user-1', {
        plannedTime: 200,
      });

      expect(result.plannedTime).toBe(200);
    });
  });

  describe('deleteCategory', () => {
    it('delegates delete to repository', async () => {
      mockCategoryRepository.delete.mockResolvedValue(mockCategory);

      const result = await service.deleteCategory('cat-1', 'user-1');

      expect(result).toEqual(mockCategory);
    });
  });

  describe('updateActualTime', () => {
    it('calls calculateAndUpdateActualTime', async () => {
      mockCategoryRepository.calculateAndUpdateActualTime.mockResolvedValue({
        ...mockCategory,
        actualTime: 90,
      });

      const result = await service.updateActualTime('cat-1');

      expect(result.actualTime).toBe(90);
      expect(
        mockCategoryRepository.calculateAndUpdateActualTime,
      ).toHaveBeenCalledWith('cat-1');
    });
  });
});
