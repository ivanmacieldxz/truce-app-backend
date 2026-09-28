import { Test, TestingModule } from '@nestjs/testing';
import { UsageStatsController } from './usage-stats.controller';
import { UsageStatsService } from './usage-stats.service';
import type { User } from '@prisma/client';

describe('UsageStatsController', () => {
  let controller: UsageStatsController;

  const mockUsageStatsService = {
    syncUsageStats: jest.fn(),
    getMyUsageStats: jest.fn(),
    getFriendUsageStats: jest.fn(),
  };

  const mockUser: User = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    username: 'tester',
    fcmToken: 'token123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsageStatsController],
      providers: [
        {
          provide: UsageStatsService,
          useValue: mockUsageStatsService,
        },
      ],
    }).compile();

    controller = module.get<UsageStatsController>(UsageStatsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('syncStats', () => {
    it('should delegate to usageStatsService.syncUsageStats', async () => {
      mockUsageStatsService.syncUsageStats.mockResolvedValue({ syncedCount: 2 });

      const dto = {
        date: '2026-09-27',
        stats: [
          { packageName: 'com.app1', name: 'App 1', timeSpent: 10 },
          { packageName: 'com.app2', name: 'App 2', timeSpent: 20 },
        ],
      };

      const result = await controller.syncStats(mockUser, dto);

      expect(result).toEqual({ syncedCount: 2 });
      expect(mockUsageStatsService.syncUsageStats).toHaveBeenCalledWith(
        mockUser.id,
        dto,
      );
    });
  });

  describe('getMyStats', () => {
    it('should delegate to usageStatsService.getMyUsageStats', async () => {
      const mockResult = [
        {
          id: 'time-1',
          appId: 'app-1',
          packageName: 'com.app1',
          appName: 'App 1',
          timeSpent: 10,
          date: '2026-09-27',
        },
      ];
      mockUsageStatsService.getMyUsageStats.mockResolvedValue(mockResult);

      const result = await controller.getMyStats(mockUser, {
        date: '2026-09-27',
        page: 1,
        limit: 20,
      });

      expect(result).toEqual(mockResult);
      expect(mockUsageStatsService.getMyUsageStats).toHaveBeenCalledWith(
        mockUser.id,
        '2026-09-27',
        1,
        20,
      );
    });
  });

  describe('getFriendStats', () => {
    it('should delegate to usageStatsService.getFriendUsageStats', async () => {
      const mockResult = [
        {
          id: 'time-2',
          appId: 'app-2',
          packageName: 'com.app2',
          appName: 'App 2',
          timeSpent: 45,
          date: '2026-09-27',
        },
      ];
      mockUsageStatsService.getFriendUsageStats.mockResolvedValue(mockResult);

      const result = await controller.getFriendStats(mockUser, 'friend-uuid-2', {
        date: '2026-09-27',
        page: 1,
        limit: 20,
      });

      expect(result).toEqual(mockResult);
      expect(mockUsageStatsService.getFriendUsageStats).toHaveBeenCalledWith(
        mockUser.id,
        'friend-uuid-2',
        '2026-09-27',
        1,
        20,
      );
    });
  });
});
