import { Injectable } from '@nestjs/common';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CategoryRepository } from './category.repository';
import { OwnershipService } from 'src/common/ownership/ownership.service';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly ownership: OwnershipService,
  ) {}

  createCategory(userId: string, createCategoryDto: CreateCategoryDto) {
    return this.categoryRepository.create(userId, createCategoryDto);
  }

  getUserCategories(userId: string) {
    return this.categoryRepository.findManyByUserId(userId);
  }

  async updateCategory(
    id: string,
    userId: string,
    updateCategoryDto: UpdateCategoryDto,
  ) {
    await this.ownership.assertCategoryOwner(id, userId);
    return this.categoryRepository.update(id, updateCategoryDto);
  }

  async deleteCategory(id: string, userId: string) {
    await this.ownership.assertCategoryOwner(id, userId);
    return this.categoryRepository.delete(id);
  }

  updateActualTime(categoryId: string) {
    return this.categoryRepository.calculateAndUpdateActualTime(categoryId);
  }
}
