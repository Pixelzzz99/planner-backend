import { Test, TestingModule } from '@nestjs/testing';
import { WeeklyFocusController } from './weekly-focus.controller';
import { WeeklyFocusService } from './weekly-focus.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWeeklyFocusDto } from './dto/create-weekly-focus.dto';
import { UpdateWeeklyFocusDto } from './dto/update-weekly-focus.dto';

describe('WeeklyFocusController', () => {
  let controller: WeeklyFocusController;
  let service: WeeklyFocusService;

  const mockWeeklyFocusService = {
    create: jest.fn(),
    getFocusesByWeekPlanId: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  };

  const mockFocus = {
    id: 'focus-uuid',
    weekPlanId: 'week-plan-uuid',
    title: 'Test Focus',
    description: 'Test Description',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WeeklyFocusController],
      providers: [
        {
          provide: WeeklyFocusService,
          useValue: mockWeeklyFocusService,
        },
        PrismaService,
      ],
    }).compile();

    controller = module.get<WeeklyFocusController>(WeeklyFocusController);
    service = module.get<WeeklyFocusService>(WeeklyFocusService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new focus', async () => {
      const createDto: CreateWeeklyFocusDto = {
        title: 'Test Focus',
        description: 'Test Description',
      };

      mockWeeklyFocusService.create.mockResolvedValue(mockFocus);

      const result = await controller.create('week-plan-uuid', createDto);

      expect(result).toEqual(mockFocus);
      expect(mockWeeklyFocusService.create).toHaveBeenCalledWith(
        'week-plan-uuid',
        createDto,
      );
    });
  });

  describe('getFocuses', () => {
    it('should return array of focuses', async () => {
      const mockFocuses = [mockFocus];
      mockWeeklyFocusService.getFocusesByWeekPlanId.mockResolvedValue(
        mockFocuses,
      );

      const result = await controller.getFocuses('week-plan-uuid');

      expect(result).toEqual(mockFocuses);
      expect(
        mockWeeklyFocusService.getFocusesByWeekPlanId,
      ).toHaveBeenCalledWith('week-plan-uuid');
    });
  });

  describe('delete', () => {
    it('should delete a focus', async () => {
      mockWeeklyFocusService.delete.mockResolvedValue(mockFocus);

      const result = await controller.delete('focus-uuid');

      expect(result).toEqual(mockFocus);
      expect(mockWeeklyFocusService.delete).toHaveBeenCalledWith('focus-uuid');
    });
  });

  describe('update', () => {
    it('should update a focus', async () => {
      const updateDto: UpdateWeeklyFocusDto = {
        title: 'Updated Focus',
        description: 'Updated Description',
      };

      mockWeeklyFocusService.update.mockResolvedValue({
        ...mockFocus,
        ...updateDto,
      });

      const result = await controller.update('focus-uuid', updateDto);

      expect(result).toEqual({
        ...mockFocus,
        ...updateDto,
      });
      expect(mockWeeklyFocusService.update).toHaveBeenCalledWith(
        'focus-uuid',
        updateDto,
      );
    });
  });
});
