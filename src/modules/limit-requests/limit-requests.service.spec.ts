import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { LimitRequestsService } from './limit-requests.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('LimitRequestsService', () => {
  let service: LimitRequestsService;

  const mockPrismaService = {
    app: {
      findUnique: jest.fn(),
    },
    friendship: {
      findMany: jest.fn(),
    },
    limitRequest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    limitRequestRecipient: {
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    userAppTime: {
      findUnique: jest.fn(),
    },
    userAppLimit: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockNotificationsService = {
    sendPushNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LimitRequestsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<LimitRequestsService>(LimitRequestsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createLimitRequest', () => {
    it('should throw BadRequestException if senderId is in receiverIds', async () => {
      await expect(
        service.createLimitRequest('user-1', {
          receiverIds: ['user-1'],
          appId: 'app-1',
          type: 'MODIFY',
          proposedLimit: 60,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if app is not found', async () => {
      mockPrismaService.app.findUnique.mockResolvedValue(null);

      await expect(
        service.createLimitRequest('user-1', {
          receiverIds: ['friend-1'],
          appId: 'app-1',
          type: 'MODIFY',
          proposedLimit: 60,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user limit is not configured for app', async () => {
      mockPrismaService.app.findUnique.mockResolvedValue({ id: 'app-1', name: 'TikTok' });
      mockPrismaService.userAppLimit.findUnique.mockResolvedValue(null);

      await expect(
        service.createLimitRequest('user-1', {
          receiverIds: ['friend-1'],
          appId: 'app-1',
          type: 'MODIFY',
          proposedLimit: 60,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if a pending limit request already exists', async () => {
      mockPrismaService.app.findUnique.mockResolvedValue({ id: 'app-1', name: 'TikTok' });
      mockPrismaService.userAppLimit.findUnique.mockResolvedValue({ id: 'limit-1', dailyLimit: 30, isEnabled: true });
      mockPrismaService.limitRequest.findFirst.mockResolvedValue({ id: 'req-pending' });

      await expect(
        service.createLimitRequest('user-1', {
          receiverIds: ['friend-1'],
          appId: 'app-1',
          type: 'MODIFY',
          proposedLimit: 60,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if MODIFY has invalid proposedLimit', async () => {
      mockPrismaService.app.findUnique.mockResolvedValue({ id: 'app-1', name: 'TikTok' });
      mockPrismaService.userAppLimit.findUnique.mockResolvedValue({ id: 'limit-1', dailyLimit: 30, isEnabled: true });
      mockPrismaService.limitRequest.findFirst.mockResolvedValue(null);

      await expect(
        service.createLimitRequest('user-1', {
          receiverIds: ['friend-1'],
          appId: 'app-1',
          type: 'MODIFY',
          proposedLimit: 0,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.createLimitRequest('user-1', {
          receiverIds: ['friend-1'],
          appId: 'app-1',
          type: 'MODIFY',
          proposedLimit: 30, // same as current limit
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if DISABLE requested on already disabled limit', async () => {
      mockPrismaService.app.findUnique.mockResolvedValue({ id: 'app-1', name: 'TikTok' });
      mockPrismaService.userAppLimit.findUnique.mockResolvedValue({ id: 'limit-1', dailyLimit: 30, isEnabled: false });
      mockPrismaService.limitRequest.findFirst.mockResolvedValue(null);

      await expect(
        service.createLimitRequest('user-1', {
          receiverIds: ['friend-1'],
          appId: 'app-1',
          type: 'DISABLE',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if receivers are not confirmed friends', async () => {
      mockPrismaService.app.findUnique.mockResolvedValue({ id: 'app-1', name: 'TikTok' });
      mockPrismaService.userAppLimit.findUnique.mockResolvedValue({ id: 'limit-1', dailyLimit: 30, isEnabled: true });
      mockPrismaService.limitRequest.findFirst.mockResolvedValue(null);
      mockPrismaService.friendship.findMany.mockResolvedValue([]);

      await expect(
        service.createLimitRequest('user-1', {
          receiverIds: ['friend-1'],
          appId: 'app-1',
          type: 'MODIFY',
          proposedLimit: 60,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a limit request and dispatch push notifications', async () => {
      mockPrismaService.app.findUnique.mockResolvedValue({
        id: 'app-1',
        name: 'TikTok',
        packageName: 'com.zhiliaoapp.musically',
      });
      mockPrismaService.userAppLimit.findUnique.mockResolvedValue({ id: 'limit-1', dailyLimit: 30, isEnabled: true });
      mockPrismaService.limitRequest.findFirst.mockResolvedValue(null);
      mockPrismaService.friendship.findMany.mockResolvedValue([
        { userId1: 'user-1', userId2: 'friend-1', status: 'ACCEPTED' },
      ]);

      const created = {
        id: 'req-1',
        senderId: 'user-1',
        appId: 'app-1',
        type: 'MODIFY',
        currentLimit: 30,
        proposedLimit: 60,
        reason: 'Study session',
        status: 'PENDING',
        createdAt: new Date(),
        sender: { username: 'ivan' },
        app: { name: 'TikTok', packageName: 'com.zhiliaoapp.musically' },
        recipients: [
          {
            id: 'recip-1',
            receiverId: 'friend-1',
            status: 'PENDING',
            createdAt: new Date(),
            receiver: { username: 'sofia', fcmToken: 'token-sofia' },
          },
        ],
      };
      mockPrismaService.limitRequest.create.mockResolvedValue(created);

      const res = await service.createLimitRequest('user-1', {
        receiverIds: ['friend-1'],
        appId: 'app-1',
        type: 'MODIFY',
        proposedLimit: 60,
        reason: 'Study session',
      });

      expect(res.id).toBe('req-1');
      expect(res.type).toBe('MODIFY');
      expect(mockNotificationsService.sendPushNotification).toHaveBeenCalledWith(
        'token-sofia',
        'Solicitud de límite',
        expect.stringContaining('@ivan te pide modificar su límite a 60 min para TikTok'),
        expect.objectContaining({
          type: 'LIMIT_REQUEST',
          action: 'SYNC_INBOX',
          requestType: 'MODIFY',
        }),
      );
    });
  });

  describe('getLimitRequests', () => {
    it('should return mapped requests', async () => {
      mockPrismaService.limitRequest.findMany.mockResolvedValue([
        {
          id: 'req-1',
          senderId: 'user-1',
          appId: 'app-1',
          type: 'DELETE',
          currentLimit: 45,
          proposedLimit: null,
          reason: 'Need focus',
          status: 'PENDING',
          createdAt: new Date(),
          sender: { username: 'ivan' },
          app: { name: 'Instagram', packageName: 'com.instagram' },
          recipients: [],
        },
      ]);

      const res = await service.getLimitRequests('user-1', 'OUTGOING', 'PENDING');
      expect(res).toHaveLength(1);
      expect(res[0].type).toBe('DELETE');
      expect(res[0].appName).toBe('Instagram');
    });

    it('should filter soft-deleted senders for INCOMING requests', async () => {
      mockPrismaService.limitRequest.findMany.mockResolvedValue([]);

      await service.getLimitRequests('user-1', 'INCOMING');

      expect(mockPrismaService.limitRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            recipients: {
              some: {
                receiverId: 'user-1',
              },
            },
            sender: { deletedAt: null },
          }),
        }),
      );
    });
  });

  describe('getLimitRequestDetail', () => {
    it('should throw NotFoundException if request not found', async () => {
      mockPrismaService.limitRequest.findUnique.mockResolvedValue(null);
      await expect(
        service.getLimitRequestDetail('user-1', 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is neither sender nor recipient', async () => {
      mockPrismaService.limitRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        senderId: 'other-user',
        recipients: [{ receiverId: 'other-friend' }],
      });

      await expect(
        service.getLimitRequestDetail('user-1', 'req-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return detail with senderUsageToday', async () => {
      mockPrismaService.limitRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        senderId: 'user-1',
        appId: 'app-1',
        type: 'DISABLE',
        currentLimit: 30,
        proposedLimit: null,
        reason: null,
        status: 'PENDING',
        createdAt: new Date(),
        sender: { username: 'ivan' },
        app: { name: 'YouTube', packageName: 'com.youtube' },
        recipients: [],
      });
      mockPrismaService.userAppTime.findUnique.mockResolvedValue({ timeSpent: 25 });
      mockPrismaService.userAppLimit.findUnique.mockResolvedValue({ dailyLimit: 30, isEnabled: true });

      const res = await service.getLimitRequestDetail('user-1', 'req-1');
      expect(res.id).toBe('req-1');
      expect(res.senderUsageToday).toEqual({
        timeSpent: 25,
        dailyLimit: 30,
        isEnabled: true,
      });
    });
  });

  describe('respondLimitRequest', () => {
    it('should throw NotFoundException if request not found', async () => {
      mockPrismaService.limitRequest.findUnique.mockResolvedValue(null);
      await expect(
        service.respondLimitRequest('user-1', 'req-1', 'APPROVED'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if request is not pending', async () => {
      mockPrismaService.limitRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        status: 'APPROVED',
      });
      await expect(
        service.respondLimitRequest('user-1', 'req-1', 'APPROVED'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should approve MODIFY request and update dailyLimit in transaction', async () => {
      const request = {
        id: 'req-1',
        senderId: 'sender-1',
        appId: 'app-1',
        type: 'MODIFY',
        proposedLimit: 90,
        status: 'PENDING',
        sender: { username: 'ivan', fcmToken: 'token-ivan' },
        app: { name: 'TikTok', packageName: 'com.tiktok' },
        recipients: [
          {
            id: 'recip-1',
            receiverId: 'user-1',
            status: 'PENDING',
            receiver: { username: 'marcos' },
          },
        ],
      };
      mockPrismaService.limitRequest.findUnique
        .mockResolvedValueOnce(request) // initial check
        .mockResolvedValueOnce({ ...request, status: 'APPROVED' }); // final return

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          limitRequestRecipient: {
            update: jest.fn(),
            updateMany: jest.fn(),
          },
          limitRequest: {
            update: jest.fn(),
          },
          userAppLimit: {
            update: jest.fn(),
          },
        };
        return await callback(tx);
      });

      const res = await service.respondLimitRequest('user-1', 'req-1', 'APPROVED');
      expect(res.status).toBe('APPROVED');
      expect(mockNotificationsService.sendPushNotification).toHaveBeenCalledWith(
        'token-ivan',
        '¡Solicitud de límite aprobada!',
        expect.stringContaining('@marcos aprobó tu solicitud de modificación (90 min) para TikTok'),
        expect.objectContaining({
          type: 'LIMIT_REQUEST_RESOLVED',
          action: 'SYNC_INBOX',
          status: 'APPROVED',
        }),
      );
    });

    it('should approve DISABLE request and set isEnabled: false in transaction', async () => {
      const request = {
        id: 'req-1',
        senderId: 'sender-1',
        appId: 'app-1',
        type: 'DISABLE',
        proposedLimit: null,
        status: 'PENDING',
        sender: { username: 'ivan', fcmToken: 'token-ivan' },
        app: { name: 'Instagram', packageName: 'com.instagram' },
        recipients: [
          {
            id: 'recip-1',
            receiverId: 'user-1',
            status: 'PENDING',
            receiver: { username: 'marcos' },
          },
        ],
      };
      mockPrismaService.limitRequest.findUnique
        .mockResolvedValueOnce(request)
        .mockResolvedValueOnce({ ...request, status: 'APPROVED' });

      let capturedTxUpdate: any;
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          limitRequestRecipient: {
            update: jest.fn(),
            updateMany: jest.fn(),
          },
          limitRequest: {
            update: jest.fn(),
          },
          userAppLimit: {
            update: jest.fn().mockImplementation((args) => {
              capturedTxUpdate = args;
            }),
          },
        };
        return await callback(tx);
      });

      await service.respondLimitRequest('user-1', 'req-1', 'APPROVED');
      expect(capturedTxUpdate.data).toEqual({ isEnabled: false });
    });

    it('should approve DELETE request and physically delete userAppLimit in transaction', async () => {
      const request = {
        id: 'req-1',
        senderId: 'sender-1',
        appId: 'app-1',
        type: 'DELETE',
        proposedLimit: null,
        status: 'PENDING',
        sender: { username: 'ivan', fcmToken: 'token-ivan' },
        app: { name: 'YouTube', packageName: 'com.youtube' },
        recipients: [
          {
            id: 'recip-1',
            receiverId: 'user-1',
            status: 'PENDING',
            receiver: { username: 'marcos' },
          },
        ],
      };
      mockPrismaService.limitRequest.findUnique
        .mockResolvedValueOnce(request)
        .mockResolvedValueOnce({ ...request, status: 'APPROVED' });

      let capturedTxDelete: any;
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          limitRequestRecipient: {
            update: jest.fn(),
            updateMany: jest.fn(),
          },
          limitRequest: {
            update: jest.fn(),
          },
          userAppLimit: {
            delete: jest.fn().mockImplementation((args) => {
              capturedTxDelete = args;
            }),
          },
        };
        return await callback(tx);
      });

      await service.respondLimitRequest('user-1', 'req-1', 'APPROVED');
      expect(capturedTxDelete.where).toEqual({
        userId_appId: {
          userId: 'sender-1',
          appId: 'app-1',
        },
      });
    });

    it('should handle REJECTED status and update overall status when all recipients reject', async () => {
      const request = {
        id: 'req-1',
        senderId: 'sender-1',
        appId: 'app-1',
        type: 'MODIFY',
        proposedLimit: 90,
        status: 'PENDING',
        sender: { username: 'ivan', fcmToken: 'token-ivan' },
        app: { name: 'TikTok', packageName: 'com.tiktok' },
        recipients: [
          {
            id: 'recip-1',
            receiverId: 'user-1',
            status: 'PENDING',
            receiver: { username: 'marcos' },
          },
        ],
      };
      mockPrismaService.limitRequest.findUnique
        .mockResolvedValueOnce(request)
        .mockResolvedValueOnce({ ...request, status: 'REJECTED' });

      mockPrismaService.limitRequestRecipient.count.mockResolvedValue(0); // 0 pending left

      const res = await service.respondLimitRequest('user-1', 'req-1', 'REJECTED');
      expect(mockPrismaService.limitRequest.update).toHaveBeenCalledWith({
        where: { id: 'req-1' },
        data: { status: 'REJECTED' },
      });
      expect(mockNotificationsService.sendPushNotification).toHaveBeenCalledWith(
        'token-ivan',
        'Solicitud de límite rechazada',
        expect.stringContaining('Tu solicitud para TikTok fue rechazada'),
        expect.objectContaining({
          type: 'LIMIT_REQUEST_RESOLVED',
          status: 'REJECTED',
        }),
      );
    });
  });
});
