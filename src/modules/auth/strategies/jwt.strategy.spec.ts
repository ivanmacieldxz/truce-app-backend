jest.mock('jwks-rsa', () => ({
  passportJwtSecret: jest.fn().mockReturnValue(jest.fn()),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy, SupabaseJwtPayload } from './jwt.strategy';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockConfig = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'supabase.url') return 'https://example.supabase.co';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    jest.clearAllMocks();
  });

  it('should throw UnauthorizedException if sub (id) is missing', async () => {
    const payload = { email: 'test@example.com' } as unknown as SupabaseJwtPayload;
    await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
  });

  it('should return user if user exists and is not deleted', async () => {
    const user = {
      id: 'user-1',
      email: 'test@example.com',
      username: 'testuser',
      deletedAt: null,
    };
    mockPrisma.user.findUnique.mockResolvedValue(user);

    const result = await strategy.validate({ sub: 'user-1', email: 'test@example.com' });
    expect(result).toEqual(user);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException if user is soft deleted', async () => {
    const user = {
      id: 'user-1',
      email: 'test@example.com',
      username: 'testuser',
      deletedAt: new Date(),
    };
    mockPrisma.user.findUnique.mockResolvedValue(user);

    await expect(
      strategy.validate({ sub: 'user-1', email: 'test@example.com' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should create and return user if user does not exist', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const createdUser = {
      id: 'user-new',
      email: 'new@example.com',
      username: 'newuser',
      deletedAt: null,
    };
    mockPrisma.user.create.mockResolvedValue(createdUser);

    const result = await strategy.validate({
      sub: 'user-new',
      email: 'new@example.com',
      user_metadata: { username: 'newuser' },
    });

    expect(result).toEqual(createdUser);
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        id: 'user-new',
        email: 'new@example.com',
        username: 'newuser',
      },
    });
  });

  it('should recover from P2002 race condition by fetching the concurrently created user', async () => {
    // 1st findUnique returns null (user not found initially)
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const p2002Error = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on the fields: (`id`)',
      {
        code: 'P2002',
        clientVersion: '5.0.0',
      },
    );
    mockPrisma.user.create.mockRejectedValue(p2002Error);

    const concurrentlyCreatedUser = {
      id: 'user-race',
      email: 'race@example.com',
      username: 'raceuser',
      deletedAt: null,
    };
    // 2nd findUnique returns the user created by concurrent request
    mockPrisma.user.findUnique.mockResolvedValueOnce(concurrentlyCreatedUser);

    const result = await strategy.validate({
      sub: 'user-race',
      email: 'race@example.com',
      user_metadata: { username: 'raceuser' },
    });

    expect(result).toEqual(concurrentlyCreatedUser);
    expect(mockPrisma.user.create).toHaveBeenCalled();
    expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(2);
  });
});
