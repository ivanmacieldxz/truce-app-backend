import { Test, TestingModule } from '@nestjs/testing';
import { FriendshipsController } from './friendships.controller';
import { FriendshipsService } from './friendships.service';

describe('FriendshipsController', () => {
  let controller: FriendshipsController;
  let service: any;

  const mockFriendshipsService = {
    getFriends: jest.fn(),
    getRequests: jest.fn(),
    sendRequest: jest.fn(),
    updateRequest: jest.fn(),
    removeFriend: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FriendshipsController],
      providers: [
        { provide: FriendshipsService, useValue: mockFriendshipsService },
      ],
    }).compile();

    controller = module.get<FriendshipsController>(FriendshipsController);
    service = module.get(FriendshipsService);
    jest.clearAllMocks();
  });

  describe('getFriends', () => {
    it('should call friendshipsService.getFriends with query date, page, and limit', async () => {
      const mockUser: any = { id: 'user-1' };
      const expectedFriends = [
        {
          id: 'f-1',
          friendId: 'friend-1',
          username: 'sofia_dev',
          createdAt: new Date(),
          activity: {
            spentMinutes: 60,
            targetLimitMinutes: 120,
            topApps: [],
            appLimits: [],
          },
        },
      ];

      mockFriendshipsService.getFriends.mockResolvedValue(expectedFriends);

      const res = await controller.getFriends(mockUser, { page: 2, limit: 10, date: '2026-10-06' });
      expect(res).toEqual(expectedFriends);
      expect(mockFriendshipsService.getFriends).toHaveBeenCalledWith('user-1', 2, 10, '2026-10-06');
    });
  });
});
