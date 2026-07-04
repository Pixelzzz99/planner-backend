import { Test, TestingModule } from '@nestjs/testing';
import { WeeklyFocusController } from './weekly-focus.controller';
import { WeeklyFocusService } from './weekly-focus.service';
import { CreateWeeklyFocusDto } from './dto/create-weekly-focus.dto';
import { UpdateWeeklyFocusDto } from './dto/update-weekly-focus.dto';

describe('WeeklyFocusController', () => {
  let controller: WeeklyFocusController;

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
      ],
    }).compile();

    controller = module.get<WeeklyFocusController>(WeeklyFocusController);
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

      const result = await controller.create(
        'week-plan-uuid',
        createDto,
        'user-1',
      );

      expect(result).toEqual(mockFocus);
      expect(mockWeeklyFocusService.create).toHaveBeenCalledWith(
        'week-plan-uuid',
        'user-1',
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

      const result = await controller.getFocuses('week-plan-uuid', 'user-1');

      expect(result).toEqual(mockFocuses);
      expect(
        mockWeeklyFocusService.getFocusesByWeekPlanId,
      ).toHaveBeenCalledWith('week-plan-uuid', 'user-1');
    });
  });

  describe('delete', () => {
    it('should delete a focus', async () => {
      mockWeeklyFocusService.delete.mockResolvedValue(mockFocus);

      const result = await controller.delete('focus-uuid', 'user-1');

      expect(result).toEqual(mockFocus);
      expect(mockWeeklyFocusService.delete).toHaveBeenCalledWith(
        'focus-uuid',
        'user-1',
      );
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

      const result = await controller.update('focus-uuid', updateDto, 'user-1');

      expect(result).toEqual({
        ...mockFocus,
        ...updateDto,
      });
      expect(mockWeeklyFocusService.update).toHaveBeenCalledWith(
        'focus-uuid',
        'user-1',
        updateDto,
      );
    });
  });
});
