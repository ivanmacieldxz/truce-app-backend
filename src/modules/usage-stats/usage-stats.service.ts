import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SyncUsageStatsDto } from './dto/sync-usage-stats.dto';
import { SyncResultDto, UserAppTimeDto } from './dto/usage-stat.dto';

@Injectable()
export class UsageStatsService {
  constructor(private readonly prisma: PrismaService) {}

  private parseDate(dateStr?: string): Date {
    const target = dateStr ?? new Date().toISOString().slice(0, 10);
    return new Date(`${target}T00:00:00.000Z`);
  }

  async syncUsageStats(
    userId: string,
    dto: SyncUsageStatsDto,
  ): Promise<SyncResultDto> {
    const date = this.parseDate(dto.date);
    let syncedCount = 0;

    for (const stat of dto.stats) {
      const app = await this.prisma.app.upsert({
        where: { packageName: stat.packageName },
        update: { name: stat.name },
        create: {
          packageName: stat.packageName,
          name: stat.name,
        },
      });

      await this.prisma.userAppTime.upsert({
        where: {
          userId_appId_date: {
            userId,
            appId: app.id,
            date,
          },
        },
        update: {
          timeSpent: stat.timeSpent,
        },
        create: {
          userId,
          appId: app.id,
          date,
          timeSpent: stat.timeSpent,
        },
      });

      syncedCount++;
    }

    return { syncedCount };
  }

  async getMyUsageStats(
    userId: string,
    dateStr?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<UserAppTimeDto[]> {
    const date = this.parseDate(dateStr);
    const skip = (page - 1) * limit;

    const stats = await this.prisma.userAppTime.findMany({
      where: {
        userId,
        date,
      },
      include: {
        app: true,
      },
      skip,
      take: limit,
      orderBy: {
        timeSpent: 'desc',
      },
    });

    return stats.map((s) => ({
      id: s.id,
      appId: s.appId,
      packageName: s.app.packageName,
      appName: s.app.name,
      timeSpent: s.timeSpent,
      date: s.date.toISOString().slice(0, 10),
    }));
  }

  async getFriendUsageStats(
    userId: string,
    friendId: string,
    dateStr?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<UserAppTimeDto[]> {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { userId1: userId, userId2: friendId },
          { userId1: friendId, userId2: userId },
        ],
      },
    });

    if (!friendship) {
      throw new ForbiddenException(
        'You can only view usage stats of confirmed friends',
      );
    }

    return this.getMyUsageStats(friendId, dateStr, page, limit);
  }
}
