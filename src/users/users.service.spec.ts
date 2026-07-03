import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { YearPlanService } from 'src/year-plan/year-plan.service';
import { NotFoundException } from '@nestjs/common';

const mockUser = {
  id: 'user-1',
  email: 'a@b.com',
  name: 'A',
  password: 'hashed',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const mockYearPlanService = {
  create: jest.fn().mockResolvedValue({}),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: YearPlanService, useValue: mockYearPlanService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('creates user and initializes year plan', async () => {
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await service.createUser({
        email: 'a@b.com',
        name: 'A',
        password: 'hashed',
      });

      expect(result).toEqual(mockUser);
      expect(mockYearPlanService.create).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getUserById', () => {
    it('returns user data without password', async () => {
      const safeUser = { id: 'user-1', email: 'a@b.com', name: 'A' };
      mockPrisma.user.findUnique.mockResolvedValue(safeUser);

      const result = await service.getUserById('user-1');

      expect(result).toEqual(safeUser);
    });
  });

  describe('getUserByEmail', () => {
    it('returns user with password for auth', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserByEmail('a@b.com');

      expect(result).toEqual(mockUser);
    });

    it('returns null when not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.getUserByEmail('notfound@b.com');

      expect(result).toBeNull();
    });
  });
});
