import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AppLimitsService } from './app-limits.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AppLimitsService', () => {
  let service: AppLimitsService;

  const mockPrismaService = {
    userAppLimit: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    app: {
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppLimitsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AppLimitsService>(AppLimitsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLimits', () => {
    it('should return a list of mapped user app limits', async () => {
      const mockLimits = [
        {
          id: 'limit-1',
          userId: 'user-1',
          appId: 'app-1',
          dailyLimit: 60,
          app: {
            id: 'app-1',
            packageName: 'com.instagram.android',
            name: 'Instagram',
          },
        },
      ];

      mockPrismaService.userAppLimit.findMany.mockResolvedValue(mockLimits);

      const result = await service.getLimits('user-1', 1, 20);

      expect(mockPrismaService.userAppLimit.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { app: true },
        skip: 0,
        take: 20,
        orderBy: { app: { name: 'asc' } },
      });

      expect(result).toEqual([
        {
          id: 'limit-1',
          appId: 'app-1',
          packageName: 'com.instagram.android',
          appName: 'Instagram',
          dailyLimit: 60,
        },
      ]);
    });
  });

  describe('getLimitById', () => {
    it('should return the limit if found and owned by user', async () => {
      const mockLimit = {
        id: 'limit-1',
        userId: 'user-1',
        appId: 'app-1',
        dailyLimit: 45,
        app: {
          id: 'app-1',
          packageName: 'com.twitter.android',
          name: 'X',
        },
      };

      mockPrismaService.userAppLimit.findUnique.mockResolvedValue(mockLimit);

      const result = await service.getLimitById('user-1', 'limit-1');

      expect(result).toEqual({
        id: 'limit-1',
        appId: 'app-1',
        packageName: 'com.twitter.android',
        appName: 'X',
        dailyLimit: 45,
      });
    });

    it('should throw NotFoundException if limit does not exist', async () => {
      mockPrismaService.userAppLimit.findUnique.mockResolvedValue(null);

      await expect(
        service.getLimitById('user-1', 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if limit belongs to another user', async () => {
      mockPrismaService.userAppLimit.findUnique.mockResolvedValue({
        id: 'limit-1',
        userId: 'other-user',
        appId: 'app-1',
        dailyLimit: 45,
        app: { id: 'app-1', packageName: 'pkg', name: 'app' },
      });

      await expect(service.getLimitById('user-1', 'limit-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createLimit', () => {
    const dto = {
      packageName: 'com.tiktok.android',
      name: 'TikTok',
      dailyLimit: 30,
    };

    it('should create a limit successfully', async () => {
      const mockApp = {
        id: 'app-1',
        packageName: dto.packageName,
        name: dto.name,
      };
      mockPrismaService.app.upsert.mockResolvedValue(mockApp);
      mockPrismaService.userAppLimit.findUnique.mockResolvedValue(null);
      mockPrismaService.userAppLimit.create.mockResolvedValue({
        id: 'limit-1',
        userId: 'user-1',
        appId: 'app-1',
        dailyLimit: 30,
        app: mockApp,
      });

      const result = await service.createLimit('user-1', dto);

      expect(mockPrismaService.app.upsert).toHaveBeenCalledWith({
        where: { packageName: dto.packageName },
        update: { name: dto.name },
        create: { packageName: dto.packageName, name: dto.name },
      });

      expect(mockPrismaService.userAppLimit.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          appId: 'app-1',
          dailyLimit: 30,
        },
        include: { app: true },
      });

      expect(result).toEqual({
        id: 'limit-1',
        appId: 'app-1',
        packageName: 'com.tiktok.android',
        appName: 'TikTok',
        dailyLimit: 30,
      });
    });

    it('should throw ConflictException if limit already exists for user and app', async () => {
      const mockApp = {
        id: 'app-1',
        packageName: dto.packageName,
        name: dto.name,
      };
      mockPrismaService.app.upsert.mockResolvedValue(mockApp);
      mockPrismaService.userAppLimit.findUnique.mockResolvedValue({
        id: 'limit-1',
        userId: 'user-1',
        appId: 'app-1',
      });

      await expect(service.createLimit('user-1', dto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrismaService.userAppLimit.create).not.toHaveBeenCalled();
    });
  });

  describe('updateLimit', () => {
    const dto = { dailyLimit: 90 };

    it('should update dailyLimit successfully', async () => {
      const mockExisting = {
        id: 'limit-1',
        userId: 'user-1',
        appId: 'app-1',
        dailyLimit: 30,
        app: { id: 'app-1', packageName: 'com.tiktok.android', name: 'TikTok' },
      };

      const mockUpdated = {
        ...mockExisting,
        dailyLimit: 90,
      };

      mockPrismaService.userAppLimit.findUnique.mockResolvedValue(mockExisting);
      mockPrismaService.userAppLimit.update.mockResolvedValue(mockUpdated);

      const result = await service.updateLimit('user-1', 'limit-1', dto);

      expect(mockPrismaService.userAppLimit.update).toHaveBeenCalledWith({
        where: { id: 'limit-1' },
        data: { dailyLimit: 90 },
        include: { app: true },
      });

      expect(result).toEqual({
        id: 'limit-1',
        appId: 'app-1',
        packageName: 'com.tiktok.android',
        appName: 'TikTok',
        dailyLimit: 90,
      });
    });

    it('should throw NotFoundException if limit does not exist', async () => {
      mockPrismaService.userAppLimit.findUnique.mockResolvedValue(null);

      await expect(
        service.updateLimit('user-1', 'non-existent', dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if limit belongs to another user', async () => {
      mockPrismaService.userAppLimit.findUnique.mockResolvedValue({
        id: 'limit-1',
        userId: 'other-user',
      });

      await expect(
        service.updateLimit('user-1', 'limit-1', dto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteLimit', () => {
    it('should delete limit successfully', async () => {
      mockPrismaService.userAppLimit.findUnique.mockResolvedValue({
        id: 'limit-1',
        userId: 'user-1',
      });
      mockPrismaService.userAppLimit.delete.mockResolvedValue({});

      await service.deleteLimit('user-1', 'limit-1');

      expect(mockPrismaService.userAppLimit.delete).toHaveBeenCalledWith({
        where: { id: 'limit-1' },
      });
    });

    it('should throw NotFoundException if limit does not exist', async () => {
      mockPrismaService.userAppLimit.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteLimit('user-1', 'non-existent'),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.userAppLimit.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if limit belongs to another user', async () => {
      mockPrismaService.userAppLimit.findUnique.mockResolvedValue({
        id: 'limit-1',
        userId: 'other-user',
      });

      await expect(service.deleteLimit('user-1', 'limit-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.userAppLimit.delete).not.toHaveBeenCalled();
    });
  });
});
