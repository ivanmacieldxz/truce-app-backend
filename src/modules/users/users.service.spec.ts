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
      findFirst: jest.fn(),
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

  describe('deleteAccount', () => {
    it('should throw NotFoundException if user does not exist or is already deleted', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.deleteAccount('user-1')).rejects.toThrow(NotFoundException);
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-1', deletedAt: null },
      });
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should soft delete user by setting deletedAt and clearing fcmToken, and call supabase deleteUser', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        username: 'user1',
        deletedAt: null,
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        deletedAt: new Date(),
        fcmToken: null,
      });
      mockSupabase.client.auth.admin.deleteUser.mockResolvedValue({ error: null });

      await service.deleteAccount('user-1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
            fcmToken: null,
            email: expect.stringMatching(/^deleted_\d+_user@example\.com$/),
            username: expect.stringMatching(/^user1_deleted_\d+$/),
          }),
        }),
      );
      expect(mockSupabase.client.auth.admin.deleteUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('searchUsers', () => {
    it('should query active users filtering deletedAt: null', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-2', username: 'alice' },
      ]);

      const result = await service.searchUsers('ali', 1, 10);

      expect(result).toHaveLength(1);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          username: {
            contains: 'ali',
            mode: 'insensitive',
          },
        },
        skip: 0,
        take: 10,
        orderBy: {
          username: 'asc',
        },
      });
    });
  });

  describe('checkUsername', () => {
    it('should return available: true when no active user has the username', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await service.checkUsername('newuser');
      expect(result).toEqual({ available: true });
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { username: 'newuser', deletedAt: null },
      });
    });

    it('should return available: false when active user exists', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-1', username: 'existing' });

      const result = await service.checkUsername('existing');
      expect(result).toEqual({ available: false });
    });
  });

  describe('checkEmail', () => {
    it('should return available: true when no active user has the email', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await service.checkEmail('test@example.com');
      expect(result).toEqual({ available: true });
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com', deletedAt: null },
      });
    });
  });

  describe('updateDailyGoal', () => {
    it('should throw NotFoundException if user does not exist or is deleted', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.updateDailyGoal('user-1', 120)).rejects.toThrow(NotFoundException);
    });

    it('should update and return user when user exists', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-1', dailyGoalMinutes: 190 });
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
