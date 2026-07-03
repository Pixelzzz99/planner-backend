import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const mockUser = { id: 'user-1', email: 'a@b.com', name: 'A' };

const mockUsersService = {
  createUser: jest.fn().mockResolvedValue(mockUser),
  getUserById: jest.fn().mockResolvedValue(mockUser),
  getAllUsers: jest.fn().mockResolvedValue([mockUser]),
  updateUser: jest.fn().mockResolvedValue(mockUser),
  deleteUser: jest.fn().mockResolvedValue(mockUser),
};

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getUser returns user by id', async () => {
    const result = await controller.getUser('user-1');
    expect(result).toEqual(mockUser);
  });
});
