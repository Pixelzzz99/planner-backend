import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { YearPlanService } from 'src/year-plan/year-plan.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly yearPlan: YearPlanService,
  ) {}

  async createUser(data: CreateUserDto) {
    try {
      const user = await this.prisma.user.create({ data });
      await this.yearPlan.create(user.id);
      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new BadRequestException(error.meta?.target as string);
      } else {
        throw error;
      }
    }
  }

  async getUserById(id: string) {
    try {
      return await this.prisma.user.findUnique({
        select: {
          id: true,
          email: true,
          name: true,
        },
        where: { id },
      });
    } catch (error) {
      console.error('Error fetching user by id:', error);
      if (error instanceof PrismaClientKnownRequestError) {
        throw new NotFoundException('User not found');
      } else {
        throw error;
      }
    }
  }

  async getUserByEmail(email: string) {
    try {
      return await this.prisma.user.findUnique({ where: { email } });
    } catch (error) {
      console.error('Error fetching user by email:', error);
      if (error instanceof PrismaClientKnownRequestError) {
        throw new NotFoundException('User not found');
      } else {
        throw error;
      }
    }
  }

  async getAllUsers() {
    try {
      return await this.prisma.user.findMany();
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }

  async updateUser(id: string, data: UpdateUserDto) {
    try {
      return await this.prisma.user.update({ where: { id }, data });
    } catch (error) {
      console.error('Error updating user:', error);
      if (error instanceof PrismaClientKnownRequestError) {
        throw new NotFoundException('User not found');
      } else {
        throw error;
      }
    }
  }

  async deleteUser(id: string) {
    try {
      return await this.prisma.user.delete({ where: { id } });
    } catch (error) {
      console.error('Error deleting user:', error);
      if (error instanceof PrismaClientKnownRequestError) {
        throw new NotFoundException('User not found');
      } else {
        throw error;
      }
    }
  }
}
