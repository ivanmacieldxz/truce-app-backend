import { Test, TestingModule } from '@nestjs/testing';
import { LimitRequestsController } from './limit-requests.controller';
import { LimitRequestsService } from './limit-requests.service';
import type { User } from '@prisma/client';

describe('LimitRequestsController', () => {
  let controller: LimitRequestsController;

  const mockLimitRequestsService = {
    createLimitRequest: jest.fn(),
    getLimitRequests: jest.fn(),
    getLimitRequestDetail: jest.fn(),
    respondLimitRequest: jest.fn(),
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
      controllers: [LimitRequestsController],
      providers: [
        {
          provide: LimitRequestsService,
          useValue: mockLimitRequestsService,
        },
      ],
    }).compile();

    controller = module.get<LimitRequestsController>(LimitRequestsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createLimitRequest', () => {
    it('should delegate to service.createLimitRequest', async () => {
      const mockResult = { id: 'req-1', status: 'PENDING', type: 'MODIFY' };
      mockLimitRequestsService.createLimitRequest.mockResolvedValue(mockResult);

      const dto = {
        receiverIds: ['friend-1'],
        appId: 'app-1',
        type: 'MODIFY' as const,
        proposedLimit: 60,
      };

      const result = await controller.createLimitRequest(mockUser, dto);
      expect(result).toBe(mockResult);
      expect(mockLimitRequestsService.createLimitRequest).toHaveBeenCalledWith(
        mockUser.id,
        dto,
      );
    });
  });

  describe('getLimitRequests', () => {
    it('should delegate to service.getLimitRequests', async () => {
      const mockResult = [{ id: 'req-1', status: 'PENDING', type: 'DISABLE' }];
      mockLimitRequestsService.getLimitRequests.mockResolvedValue(mockResult);

      const result = await controller.getLimitRequests(mockUser, {
        type: 'INCOMING',
        status: 'PENDING',
        page: 1,
        limit: 10,
      });

      expect(result).toBe(mockResult);
      expect(mockLimitRequestsService.getLimitRequests).toHaveBeenCalledWith(
        mockUser.id,
        'INCOMING',
        'PENDING',
        1,
        10,
      );
    });
  });

  describe('getLimitRequestDetail', () => {
    it('should delegate to service.getLimitRequestDetail', async () => {
      const mockResult = { id: 'req-1', senderUsageToday: { timeSpent: 10 } };
      mockLimitRequestsService.getLimitRequestDetail.mockResolvedValue(mockResult);

      const result = await controller.getLimitRequestDetail(mockUser, 'req-1');
      expect(result).toBe(mockResult);
      expect(mockLimitRequestsService.getLimitRequestDetail).toHaveBeenCalledWith(
        mockUser.id,
        'req-1',
      );
    });
  });

  describe('respondLimitRequest', () => {
    it('should delegate to service.respondLimitRequest', async () => {
      const mockResult = { id: 'req-1', status: 'APPROVED', type: 'DELETE' };
      mockLimitRequestsService.respondLimitRequest.mockResolvedValue(mockResult);

      const result = await controller.respondLimitRequest(mockUser, 'req-1', {
        status: 'APPROVED',
      });
      expect(result).toBe(mockResult);
      expect(mockLimitRequestsService.respondLimitRequest).toHaveBeenCalledWith(
        mockUser.id,
        'req-1',
        'APPROVED',
      );
    });
  });
});
