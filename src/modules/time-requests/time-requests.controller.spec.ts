import { Test, TestingModule } from '@nestjs/testing';
import { TimeRequestsController } from './time-requests.controller';
import { TimeRequestsService } from './time-requests.service';
import type { User } from '@prisma/client';

describe('TimeRequestsController', () => {
  let controller: TimeRequestsController;

  const mockTimeRequestsService = {
    createTimeRequest: jest.fn(),
    getTimeRequests: jest.fn(),
    getTimeRequestDetail: jest.fn(),
    respondTimeRequest: jest.fn(),
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
      controllers: [TimeRequestsController],
      providers: [
        {
          provide: TimeRequestsService,
          useValue: mockTimeRequestsService,
        },
      ],
    }).compile();

    controller = module.get<TimeRequestsController>(TimeRequestsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createTimeRequest', () => {
    it('should delegate to service.createTimeRequest', async () => {
      const mockResult = { id: 'req-1', status: 'PENDING' };
      mockTimeRequestsService.createTimeRequest.mockResolvedValue(mockResult);

      const dto = {
        receiverIds: ['friend-1'],
        appId: 'app-1',
        amountRequested: 15,
      };

      const result = await controller.createTimeRequest(mockUser, dto);
      expect(result).toBe(mockResult);
      expect(mockTimeRequestsService.createTimeRequest).toHaveBeenCalledWith(
        mockUser.id,
        dto,
      );
    });
  });

  describe('getTimeRequests', () => {
    it('should delegate to service.getTimeRequests', async () => {
      const mockResult = [{ id: 'req-1', status: 'PENDING' }];
      mockTimeRequestsService.getTimeRequests.mockResolvedValue(mockResult);

      const result = await controller.getTimeRequests(mockUser, {
        type: 'INCOMING',
        status: 'PENDING',
        page: 1,
        limit: 10,
      });

      expect(result).toBe(mockResult);
      expect(mockTimeRequestsService.getTimeRequests).toHaveBeenCalledWith(
        mockUser.id,
        'INCOMING',
        'PENDING',
        1,
        10,
      );
    });
  });

  describe('getTimeRequestDetail', () => {
    it('should delegate to service.getTimeRequestDetail', async () => {
      const mockResult = { id: 'req-1', senderUsageToday: { timeSpent: 10 } };
      mockTimeRequestsService.getTimeRequestDetail.mockResolvedValue(mockResult);

      const result = await controller.getTimeRequestDetail(mockUser, 'req-1');
      expect(result).toBe(mockResult);
      expect(mockTimeRequestsService.getTimeRequestDetail).toHaveBeenCalledWith(
        mockUser.id,
        'req-1',
      );
    });
  });

  describe('respondTimeRequest', () => {
    it('should delegate to service.respondTimeRequest', async () => {
      const mockResult = { id: 'req-1', status: 'APPROVED' };
      mockTimeRequestsService.respondTimeRequest.mockResolvedValue(mockResult);

      const result = await controller.respondTimeRequest(mockUser, 'req-1', {
        status: 'APPROVED',
      });
      expect(result).toBe(mockResult);
      expect(mockTimeRequestsService.respondTimeRequest).toHaveBeenCalledWith(
        mockUser.id,
        'req-1',
        'APPROVED',
      );
    });
  });
});
