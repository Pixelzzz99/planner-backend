import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const mockUser = {
  id: 'user-uuid-1',
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashed',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUsersService = {
  getUserByEmail: jest.fn(),
  getUserById: jest.fn(),
  createUser: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('jwt-token'),
  decode: jest.fn().mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 }),
};

const revokedTokens = new Map<string, { expiresAt: Date }>();

const mockPrismaService = {
  revokedToken: {
    upsert: jest.fn(({ where, create }) => {
      revokedTokens.set(where.tokenHash, {
        expiresAt: create.expiresAt,
      });
      return Promise.resolve(create);
    }),
    findUnique: jest.fn(({ where }) => {
      const entry = revokedTokens.get(where.tokenHash);
      return Promise.resolve(
        entry ? { tokenHash: where.tokenHash, ...entry } : null,
      );
    }),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
  },
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    revokedTokens.clear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('throws if email already in use', async () => {
      mockUsersService.getUserByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register('test@example.com', 'Test', 'pass'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('creates user and returns token', async () => {
      mockUsersService.getUserByEmail.mockResolvedValue(null);
      mockUsersService.createUser.mockResolvedValue(mockUser);
      mockUsersService.getUserById.mockResolvedValue(mockUser);

      const result = await service.register('new@example.com', 'New', 'pass');

      expect(result).toEqual({ accessToken: 'jwt-token' });
      expect(mockUsersService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@example.com', name: 'New' }),
      );
    });
  });

  describe('login', () => {
    it('throws if user not found', async () => {
      mockUsersService.getUserByEmail.mockResolvedValue(null);

      await expect(
        service.login('unknown@example.com', 'pass'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws if password is wrong', async () => {
      const hashed = await bcrypt.hash('correct', 10);
      mockUsersService.getUserByEmail.mockResolvedValue({
        ...mockUser,
        password: hashed,
      });

      await expect(
        service.login('test@example.com', 'wrong'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns token on valid credentials', async () => {
      const hashed = await bcrypt.hash('correct', 10);
      mockUsersService.getUserByEmail.mockResolvedValue({
        ...mockUser,
        password: hashed,
      });
      mockUsersService.getUserById.mockResolvedValue(mockUser);

      const result = await service.login('test@example.com', 'correct');

      expect(result).toEqual({ accessToken: 'jwt-token' });
    });
  });

  describe('logout / isTokenInvalid', () => {
    it('invalidates token after logout', async () => {
      const token = 'some-jwt-token';

      expect(await service.isTokenInvalid(token)).toBe(false);

      await service.logout(token);

      expect(await service.isTokenInvalid(token)).toBe(true);
    });

    it('returns false for unknown token', async () => {
      expect(await service.isTokenInvalid('never-logged-out')).toBe(false);
    });
  });

  describe('me', () => {
    it('returns user info', async () => {
      mockUsersService.getUserById.mockResolvedValue(mockUser);

      const result = await service.me('user-uuid-1');

      expect(result).toEqual(mockUser);
      expect(mockUsersService.getUserById).toHaveBeenCalledWith('user-uuid-1');
    });
  });
});
