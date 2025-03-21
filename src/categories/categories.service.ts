import { Injectable } from '@nestjs/common';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CategoryRepository } from './category.repository';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  createCategory(userId: string, createCategoryDto: CreateCategoryDto) {
    return this.categoryRepository.create(userId, createCategoryDto);
  }

  getUserCategories(userId: string) {
    return this.categoryRepository.findManyByUserId(userId);
  }

  updateCategory(id: string, updateCategoryDto: UpdateCategoryDto) {
    return this.categoryRepository.update(id, updateCategoryDto);
  }

  deleteCategory(id: string) {
    return this.categoryRepository.delete(id);
  }

  updateActualTime(categoryId: string) {
    return this.categoryRepository.calculateAndUpdateActualTime(categoryId);
  }
}
