import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { UsageStatsService } from './usage-stats.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('UsageStatsService', () => {
  let service: UsageStatsService;

  const mockPrismaService = {
    app: {
      upsert: jest.fn(),
    },
    userAppTime: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    friendship: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsageStatsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsageStatsService>(UsageStatsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('syncUsageStats', () => {
    it('should upsert apps and userAppTimes in batch', async () => {
      mockPrismaService.app.upsert.mockResolvedValue({
        id: 'app-1',
        packageName: 'com.whatsapp',
        name: 'WhatsApp',
      });
      mockPrismaService.userAppTime.upsert.mockResolvedValue({
        id: 'time-1',
        userId: 'user-1',
        appId: 'app-1',
        timeSpent: 45,
        date: new Date('2026-09-27T00:00:00.000Z'),
      });

      const result = await service.syncUsageStats('user-1', {
        date: '2026-09-27',
        stats: [
          {
            packageName: 'com.whatsapp',
            name: 'WhatsApp',
            timeSpent: 45,
          },
        ],
      });

      expect(result).toEqual({ syncedCount: 1 });
      expect(mockPrismaService.app.upsert).toHaveBeenCalledWith({
        where: { packageName: 'com.whatsapp' },
        update: { name: 'WhatsApp' },
        create: { packageName: 'com.whatsapp', name: 'WhatsApp' },
      });
      expect(mockPrismaService.userAppTime.upsert).toHaveBeenCalled();
    });
  });

  describe('getMyUsageStats', () => {
    it('should return a list of mapped userAppTime records', async () => {
      mockPrismaService.userAppTime.findMany.mockResolvedValue([
        {
          id: 'time-1',
          userId: 'user-1',
          appId: 'app-1',
          timeSpent: 120,
          date: new Date('2026-09-27T00:00:00.000Z'),
          app: {
            id: 'app-1',
            packageName: 'com.instagram.android',
            name: 'Instagram',
          },
        },
      ]);

      const result = await service.getMyUsageStats('user-1', '2026-09-27', 1, 20);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'time-1',
        appId: 'app-1',
        packageName: 'com.instagram.android',
        appName: 'Instagram',
        timeSpent: 120,
        date: '2026-09-27',
      });
    });
  });

  describe('getFriendUsageStats', () => {
    it('should throw ForbiddenException if users are not friends', async () => {
      mockPrismaService.friendship.findFirst.mockResolvedValue(null);

      await expect(
        service.getFriendUsageStats('user-1', 'friend-2', '2026-09-27', 1, 20),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return friends usage stats if friendship is ACCEPTED', async () => {
      mockPrismaService.friendship.findFirst.mockResolvedValue({
        id: 'f-1',
        userId1: 'user-1',
        userId2: 'friend-2',
        status: 'ACCEPTED',
      });

      mockPrismaService.userAppTime.findMany.mockResolvedValue([
        {
          id: 'time-2',
          userId: 'friend-2',
          appId: 'app-1',
          timeSpent: 90,
          date: new Date('2026-09-27T00:00:00.000Z'),
          app: {
            id: 'app-1',
            packageName: 'com.twitter.android',
            name: 'X',
          },
        },
      ]);

      const result = await service.getFriendUsageStats(
        'user-1',
        'friend-2',
        '2026-09-27',
        1,
        20,
      );

      expect(result).toHaveLength(1);
      expect(result[0].timeSpent).toBe(90);
    });
  });
});
