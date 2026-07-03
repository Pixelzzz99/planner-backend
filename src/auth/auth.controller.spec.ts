import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const mockAuthService = {
  login: jest.fn().mockResolvedValue({ accessToken: 'token' }),
  register: jest.fn().mockResolvedValue({ accessToken: 'token' }),
  me: jest.fn().mockResolvedValue({ id: '1', email: 'a@b.com', name: 'A' }),
  logout: jest.fn().mockResolvedValue({ message: 'Logged out successfully' }),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('login delegates to service', async () => {
    const result = await controller.login({
      email: 'a@b.com',
      password: 'pass',
    });
    expect(result).toEqual({ accessToken: 'token' });
    expect(mockAuthService.login).toHaveBeenCalledWith('a@b.com', 'pass');
  });

  it('register delegates to service', async () => {
    const result = await controller.register({
      email: 'a@b.com',
      name: 'A',
      password: 'pass',
    });
    expect(result).toEqual({ accessToken: 'token' });
  });
});
