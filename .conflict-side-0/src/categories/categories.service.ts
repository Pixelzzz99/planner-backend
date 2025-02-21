import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prismaService: PrismaService) {}

  async createCategory(userId: string, name: string) {
    return this.prismaService.category.create({
      data: {
        name,
        user: {
          connect: { id: userId },
        },
      },
    });
  }

  async getUserCategories(userId: string) {
    return this.prismaService.category.findMany({
      where: {
        userId,
      },
    });
  }

  async updateCategory(id: string, name: string) {
    return this.prismaService.category.update({
      where: { id },
      data: { name },
    });
  }

  async deleteCategory(id: string) {
    return this.prismaService.category.delete({
      where: { id },
    });
  }
}
