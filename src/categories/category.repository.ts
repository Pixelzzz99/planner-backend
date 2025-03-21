import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, createCategoryDto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        ...createCategoryDto,
        user: {
          connect: { id: userId },
        },
      },
    });
  }

  findManyByUserId(userId: string) {
    return this.prisma.category.findMany({
      where: { userId },
      include: {
        tasks: {
          select: {
            duration: true,
          },
        },
      },
    });
  }

  update(id: string, updateCategoryDto: UpdateCategoryDto) {
    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  delete(id: string) {
    return this.prisma.category.delete({
      where: { id },
    });
  }

  async calculateAndUpdateActualTime(categoryId: string) {
    const tasks = await this.prisma.task.findMany({
      where: {
        categoryId,
        isArchived: false,
      },
      select: {
        duration: true,
      },
    });

    const actualTime = tasks.reduce((sum, task) => sum + task.duration, 0);

    return this.prisma.category.update({
      where: { id: categoryId },
      data: { actualTime },
    });
  }
}
