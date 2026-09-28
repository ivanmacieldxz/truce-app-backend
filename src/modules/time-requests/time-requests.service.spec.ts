import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TimeRequestsService } from './time-requests.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('TimeRequestsService', () => {
  let service: TimeRequestsService;

  const mockPrismaService = {
    app: {
      findUnique: jest.fn(),
    },
    friendship: {
      findMany: jest.fn(),
    },
    timeRequest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    timeRequestRecipient: {
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
    },
    $transaction: jest.fn(),
  };

  const mockNotificationsService = {
    sendPushNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeRequestsService,
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

    service = module.get<TimeRequestsService>(TimeRequestsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTimeRequest', () => {
    it('should throw BadRequestException if senderId is in receiverIds', async () => {
      await expect(
        service.createTimeRequest('user-1', {
          receiverIds: ['user-1'],
          appId: 'app-1',
          amountRequested: 15,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if app is not found', async () => {
      mockPrismaService.app.findUnique.mockResolvedValue(null);

      await expect(
        service.createTimeRequest('user-1', {
          receiverIds: ['friend-1'],
          appId: 'app-1',
          amountRequested: 15,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if not all receivers are confirmed friends', async () => {
      mockPrismaService.app.findUnique.mockResolvedValue({
        id: 'app-1',
        name: 'Instagram',
        packageName: 'com.instagram',
      });
      mockPrismaService.friendship.findMany.mockResolvedValue([]); // No friendships

      await expect(
        service.createTimeRequest('user-1', {
          receiverIds: ['friend-1'],
          appId: 'app-1',
          amountRequested: 15,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create time request and send push notifications to friends', async () => {
      mockPrismaService.app.findUnique.mockResolvedValue({
        id: 'app-1',
        name: 'Instagram',
        packageName: 'com.instagram',
      });
      mockPrismaService.friendship.findMany.mockResolvedValue([
        {
          id: 'f-1',
          userId1: 'user-1',
          userId2: 'friend-1',
          status: 'ACCEPTED',
        },
      ]);
      const createdRequest = {
        id: 'req-1',
        senderId: 'user-1',
        appId: 'app-1',
        amountRequested: 15,
        message: 'Need 15 min please',
        status: 'PENDING',
        createdAt: new Date(),
        sender: { username: 'senderUser' },
        app: { id: 'app-1', name: 'Instagram', packageName: 'com.instagram' },
        recipients: [
          {
            id: 'recip-1',
            receiverId: 'friend-1',
            status: 'PENDING',
            createdAt: new Date(),
            receiver: { username: 'friendUser', fcmToken: 'token-friend' },
          },
        ],
      };
      mockPrismaService.timeRequest.create.mockResolvedValue(createdRequest);

      const result = await service.createTimeRequest('user-1', {
        receiverIds: ['friend-1'],
        appId: 'app-1',
        amountRequested: 15,
        message: 'Need 15 min please',
      });

      expect(result.id).toBe('req-1');
      expect(result.senderUsername).toBe('senderUser');
      expect(mockNotificationsService.sendPushNotification).toHaveBeenCalledWith(
        'token-friend',
        'Solicitud de tiempo extra',
        expect.stringContaining('@senderUser te pide 15 min'),
        expect.any(Object),
      );
    });
  });

  describe('getTimeRequests', () => {
    it('should return list of time requests', async () => {
      mockPrismaService.timeRequest.findMany.mockResolvedValue([
        {
          id: 'req-1',
          senderId: 'user-1',
          appId: 'app-1',
          amountRequested: 20,
          message: null,
          status: 'PENDING',
          createdAt: new Date(),
          sender: { username: 'user1' },
          app: { id: 'app-1', name: 'TikTok', packageName: 'com.tiktok' },
          recipients: [],
        },
      ]);

      const result = await service.getTimeRequests('user-1', 'OUTGOING');
      expect(result).toHaveLength(1);
      expect(result[0].appName).toBe('TikTok');
    });
  });

  describe('getTimeRequestDetail', () => {
    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.timeRequest.findUnique.mockResolvedValue(null);
      await expect(
        service.getTimeRequestDetail('user-1', 'req-nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is neither sender nor recipient', async () => {
      mockPrismaService.timeRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        senderId: 'other-user',
        recipients: [{ receiverId: 'another-user' }],
      });
      await expect(
        service.getTimeRequestDetail('user-1', 'req-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return request detail with senderUsageToday', async () => {
      mockPrismaService.timeRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        senderId: 'user-1',
        appId: 'app-1',
        amountRequested: 15,
        message: null,
        status: 'PENDING',
        createdAt: new Date(),
        sender: { username: 'user1' },
        app: { id: 'app-1', name: 'YouTube', packageName: 'com.youtube' },
        recipients: [],
      });
      mockPrismaService.userAppTime.findUnique.mockResolvedValue({
        timeSpent: 45,
      });
      mockPrismaService.userAppLimit.findUnique.mockResolvedValue({
        dailyLimit: 30,
      });

      const result = await service.getTimeRequestDetail('user-1', 'req-1');
      expect(result.id).toBe('req-1');
      expect(result.senderUsageToday).toEqual({
        timeSpent: 45,
        dailyLimit: 30,
      });
    });
  });

  describe('respondTimeRequest', () => {
    it('should throw BadRequestException if request is not PENDING', async () => {
      mockPrismaService.timeRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        status: 'APPROVED',
        recipients: [],
      });
      await expect(
        service.respondTimeRequest('user-2', 'req-1', 'APPROVED'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should execute transaction, increase app limit and send push notification on APPROVE', async () => {
      const mockRequest = {
        id: 'req-1',
        senderId: 'user-1',
        appId: 'app-1',
        amountRequested: 15,
        status: 'PENDING',
        sender: { username: 'user1', fcmToken: 'sender-token' },
        app: { id: 'app-1', name: 'Instagram', packageName: 'com.instagram' },
        recipients: [
          {
            id: 'recip-1',
            receiverId: 'user-2',
            status: 'PENDING',
            receiver: { username: 'friendUser' },
          },
        ],
      };

      mockPrismaService.timeRequest.findUnique
        .mockResolvedValueOnce(mockRequest) // initial lookup
        .mockResolvedValueOnce({
          ...mockRequest,
          status: 'APPROVED',
          recipients: [{ ...mockRequest.recipients[0], status: 'APPROVED' }],
        }); // updated lookup

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          timeRequestRecipient: {
            update: jest.fn(),
            updateMany: jest.fn(),
          },
          timeRequest: {
            update: jest.fn(),
          },
          userAppLimit: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'limit-1',
              dailyLimit: 60,
            }),
            update: jest.fn(),
          },
        });
      });

      const result = await service.respondTimeRequest(
        'user-2',
        'req-1',
        'APPROVED',
      );

      expect(result.status).toBe('APPROVED');
      expect(mockNotificationsService.sendPushNotification).toHaveBeenCalledWith(
        'sender-token',
        '¡Tiempo extra aprobado!',
        expect.stringContaining('@friendUser aprobó tu solicitud de 15 min'),
        expect.any(Object),
      );
    });
  });
});
