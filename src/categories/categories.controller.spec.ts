import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

const mockCategory = {
  id: 'cat-1',
  userId: 'user-1',
  name: 'Work',
  plannedTime: 120,
  actualTime: 60,
  createdAt: new Date(),
};

const mockCategoriesService = {
  createCategory: jest.fn().mockResolvedValue(mockCategory),
  getUserCategories: jest.fn().mockResolvedValue([mockCategory]),
  updateCategory: jest.fn().mockResolvedValue(mockCategory),
  deleteCategory: jest.fn().mockResolvedValue(mockCategory),
};

describe('CategoriesController', () => {
  let controller: CategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [{ provide: CategoriesService, useValue: mockCategoriesService }],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
