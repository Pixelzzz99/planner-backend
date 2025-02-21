import {
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Delete,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('categories')
@UseGuards(AuthGuard('jwt'))
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post(':userId')
  createCategory(@Param('userId') userId: string, @Body('name') name: string) {
    return this.categoriesService.createCategory(userId, name);
  }

  @Get(':userId')
  getUserCategories(@Param('userId') userId: string) {
    return this.categoriesService.getUserCategories(userId);
  }

  @Patch(':id')
  updateCategory(@Param('id') id: string, @Body('name') name: string) {
    return this.categoriesService.updateCategory(id, name);
  }

  @Delete(':id')
  deleteCategory(@Param('id') id: string) {
    return this.categoriesService.deleteCategory(id);
  }
}
