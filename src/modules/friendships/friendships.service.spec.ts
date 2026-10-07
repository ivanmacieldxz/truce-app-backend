import { Test, TestingModule } from '@nestjs/testing';
import { FriendshipsService } from './friendships.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

describe('FriendshipsService', () => {
  let service: FriendshipsService;
  let prisma: any;
  let notifications: any;

  const mockPrisma = {
    friendship: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    userAppTime: {
      findMany: jest.fn(),
    },
    userAppLimit: {
      findMany: jest.fn(),
    },
  };

  const mockNotifications = {
    sendPushNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendshipsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<FriendshipsService>(FriendshipsService);
    prisma = module.get(PrismaService);
    notifications = module.get(NotificationsService);
    jest.clearAllMocks();
  });

  describe('getFriends', () => {
    it('should return empty list when no friendships found', async () => {
      mockPrisma.friendship.findMany.mockResolvedValue([]);

      const result = await service.getFriends('user-1', 1, 20);
      expect(result).toEqual([]);
      expect(mockPrisma.user.findMany).not.toHaveBeenCalled();
    });

    it('should return friends with aggregated activity, top apps, and app limits', async () => {
      const now = new Date();
      mockPrisma.friendship.findMany.mockResolvedValue([
        {
          id: 'f-1',
          userId1: 'user-1',
          userId2: 'friend-1',
          user1: { id: 'user-1', username: 'me' },
          user2: { id: 'friend-1', username: 'sofia_dev' },
          createdAt: now,
        },
      ]);

      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'friend-1', dailyGoalMinutes: 120 },
      ]);

      mockPrisma.userAppTime.findMany.mockResolvedValue([
        {
          userId: 'friend-1',
          timeSpent: 45,
          app: { name: 'Instagram', packageName: 'com.instagram.android' },
        },
        {
          userId: 'friend-1',
          timeSpent: 35,
          app: { name: 'Discord', packageName: 'com.discord' },
        },
        {
          userId: 'friend-1',
          timeSpent: 25,
          app: { name: 'Twitter / X', packageName: 'com.twitter.android' },
        },
        {
          userId: 'friend-1',
          timeSpent: 10,
          app: { name: 'YouTube', packageName: 'com.youtube.android' },
        },
      ]);

      mockPrisma.userAppLimit.findMany.mockResolvedValue([
        {
          userId: 'friend-1',
          dailyLimit: 45,
          isEnabled: true,
          app: { name: 'Instagram', packageName: 'com.instagram.android' },
        },
      ]);

      const result = await service.getFriends('user-1', 1, 20, '2026-10-06');

      expect(result).toHaveLength(1);
      const friend = result[0];
      expect(friend.friendId).toBe('friend-1');
      expect(friend.username).toBe('sofia_dev');
      expect(friend.activity.spentMinutes).toBe(115); // 45 + 35 + 25 + 10
      expect(friend.activity.targetLimitMinutes).toBe(120);
      expect(friend.activity.topApps).toHaveLength(3); // Top 3
      expect(friend.activity.topApps[0]).toEqual({
        name: 'Instagram',
        packageName: 'com.instagram.android',
        minutesSpent: 45,
      });
      expect(friend.activity.appLimits).toHaveLength(1);
      expect(friend.activity.appLimits[0]).toEqual({
        name: 'Instagram',
        packageName: 'com.instagram.android',
        limitMinutes: 45,
        isEnabled: true,
      });
    });

    it('should fallback to default targetLimitMinutes of 190 when user goal is undefined', async () => {
      mockPrisma.friendship.findMany.mockResolvedValue([
        {
          id: 'f-1',
          userId1: 'user-2',
          userId2: 'user-1',
          user1: { id: 'user-2', username: 'matias_g' },
          user2: { id: 'user-1', username: 'me' },
          createdAt: new Date(),
        },
      ]);

      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.userAppTime.findMany.mockResolvedValue([]);
      mockPrisma.userAppLimit.findMany.mockResolvedValue([]);

      const result = await service.getFriends('user-1', 1, 20);

      expect(result).toHaveLength(1);
      expect(result[0].activity.spentMinutes).toBe(0);
      expect(result[0].activity.targetLimitMinutes).toBe(190);
      expect(result[0].activity.topApps).toEqual([]);
      expect(result[0].activity.appLimits).toEqual([]);
    });
  });

  describe('sendRequest', () => {
    it('should ignore and return null when target user does not exist or is soft-deleted', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await service.sendRequest('user-1', 'deleted-user');

      expect(result).toBeNull();
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'deleted-user', deletedAt: null },
      });
      expect(mockPrisma.friendship.create).not.toHaveBeenCalled();
    });
  });

  describe('getRequests', () => {
    it('should query requests filtering out soft-deleted users', async () => {
      mockPrisma.friendship.findMany.mockResolvedValue([]);

      await service.getRequests('user-1', undefined, 1, 10);

      expect(mockPrisma.friendship.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PENDING',
            OR: [
              { userId1: 'user-1', user2: { deletedAt: null } },
              { userId2: 'user-1', user1: { deletedAt: null } },
            ],
          }),
        }),
      );
    });
  });
});
