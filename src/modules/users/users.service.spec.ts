import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;
  let supabase: any;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockSupabase = {
    client: {
      auth: {
        admin: {
          updateUserById: jest.fn(),
          deleteUser: jest.fn(),
        },
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SupabaseService, useValue: mockSupabase },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService);
    supabase = module.get(SupabaseService);
    jest.clearAllMocks();
  });

  describe('updateDailyGoal', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.updateDailyGoal('user-1', 120)).rejects.toThrow(NotFoundException);
    });

    it('should update and return user when user exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', dailyGoalMinutes: 190 });
      mockPrisma.user.update.mockResolvedValue({ id: 'user-1', dailyGoalMinutes: 120 });

      const result = await service.updateDailyGoal('user-1', 120);
      expect(result.dailyGoalMinutes).toBe(120);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { dailyGoalMinutes: 120 },
      });
    });
  });
});
