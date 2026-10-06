import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: any;

  const mockUsersService = {
    updateDailyGoal: jest.fn(),
    getProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
    jest.clearAllMocks();
  });

  describe('updateDailyGoal', () => {
    it('should call usersService.updateDailyGoal and return updated user dto', async () => {
      const mockUser: any = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        fcmToken: null,
        dailyGoalMinutes: 190,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.updateDailyGoal.mockResolvedValue({
        ...mockUser,
        dailyGoalMinutes: 150,
      });

      const res = await controller.updateDailyGoal(mockUser, { dailyGoalMinutes: 150 });
      expect(res.dailyGoalMinutes).toBe(150);
      expect(mockUsersService.updateDailyGoal).toHaveBeenCalledWith('user-1', 150);
    });
  });

  describe('getProfile', () => {
    it('should return user profile including dailyGoalMinutes', async () => {
      const mockUser: any = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        fcmToken: null,
        dailyGoalMinutes: 180,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const res = await controller.getProfile(mockUser);
      expect(res.dailyGoalMinutes).toBe(180);
    });
  });
});
