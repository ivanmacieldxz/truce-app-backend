import { Test, TestingModule } from '@nestjs/testing';
import { AppLimitsController } from './app-limits.controller';
import { AppLimitsService } from './app-limits.service';
import type { User } from '@prisma/client';

describe('AppLimitsController', () => {
  let controller: AppLimitsController;

  const mockAppLimitsService = {
    getLimits: jest.fn(),
    getLimitById: jest.fn(),
    createLimit: jest.fn(),
    updateLimit: jest.fn(),
    deleteLimit: jest.fn(),
  };

  const mockUser: User = {
    id: 'user-1',
    email: 'user@example.com',
    username: 'testuser',
    fcmToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppLimitsController],
      providers: [
        {
          provide: AppLimitsService,
          useValue: mockAppLimitsService,
        },
      ],
    }).compile();

    controller = module.get<AppLimitsController>(AppLimitsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLimits', () => {
    it('should call service.getLimits with query params', async () => {
      const expected = [
        {
          id: 'limit-1',
          appId: 'app-1',
          packageName: 'com.instagram.android',
          appName: 'Instagram',
          dailyLimit: 60,
        },
      ];
      mockAppLimitsService.getLimits.mockResolvedValue(expected);

      const result = await controller.getLimits(mockUser, {
        page: 2,
        limit: 10,
      });

      expect(mockAppLimitsService.getLimits).toHaveBeenCalledWith(
        'user-1',
        2,
        10,
      );
      expect(result).toEqual(expected);
    });

    it('should use default page 1 and limit 20 if omitted', async () => {
      mockAppLimitsService.getLimits.mockResolvedValue([]);

      await controller.getLimits(mockUser, {});

      expect(mockAppLimitsService.getLimits).toHaveBeenCalledWith(
        'user-1',
        1,
        20,
      );
    });
  });

  describe('getLimitById', () => {
    it('should call service.getLimitById', async () => {
      const expected = {
        id: 'limit-1',
        appId: 'app-1',
        packageName: 'com.instagram.android',
        appName: 'Instagram',
        dailyLimit: 60,
      };
      mockAppLimitsService.getLimitById.mockResolvedValue(expected);

      const result = await controller.getLimitById(mockUser, 'limit-1');

      expect(mockAppLimitsService.getLimitById).toHaveBeenCalledWith(
        'user-1',
        'limit-1',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('createLimit', () => {
    it('should call service.createLimit', async () => {
      const dto = {
        packageName: 'com.instagram.android',
        name: 'Instagram',
        dailyLimit: 60,
      };
      const expected = {
        id: 'limit-1',
        appId: 'app-1',
        ...dto,
      };
      mockAppLimitsService.createLimit.mockResolvedValue(expected);

      const result = await controller.createLimit(mockUser, dto);

      expect(mockAppLimitsService.createLimit).toHaveBeenCalledWith(
        'user-1',
        dto,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('updateLimit', () => {
    it('should call service.updateLimit', async () => {
      const dto = { dailyLimit: 120 };
      const expected = {
        id: 'limit-1',
        appId: 'app-1',
        packageName: 'com.instagram.android',
        appName: 'Instagram',
        dailyLimit: 120,
      };
      mockAppLimitsService.updateLimit.mockResolvedValue(expected);

      const result = await controller.updateLimit(mockUser, 'limit-1', dto);

      expect(mockAppLimitsService.updateLimit).toHaveBeenCalledWith(
        'user-1',
        'limit-1',
        dto,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('deleteLimit', () => {
    it('should call service.deleteLimit', async () => {
      mockAppLimitsService.deleteLimit.mockResolvedValue(undefined);

      await controller.deleteLimit(mockUser, 'limit-1');

      expect(mockAppLimitsService.deleteLimit).toHaveBeenCalledWith(
        'user-1',
        'limit-1',
      );
    });
  });
});
