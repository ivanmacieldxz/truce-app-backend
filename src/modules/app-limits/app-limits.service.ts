import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAppLimitDto } from './dto/create-app-limit.dto';
import { UpdateAppLimitDto } from './dto/update-app-limit.dto';
import { UserAppLimitDto } from './dto/app-limit.dto';

@Injectable()
export class AppLimitsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLimits(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<UserAppLimitDto[]> {
    const skip = (page - 1) * limit;

    const userLimits = await this.prisma.userAppLimit.findMany({
      where: { userId },
      include: {
        app: true,
      },
      skip,
      take: limit,
      orderBy: {
        app: {
          name: 'asc',
        },
      },
    });

    return userLimits.map((l) => ({
      id: l.id,
      appId: l.appId,
      packageName: l.app.packageName,
      appName: l.app.name,
      dailyLimit: l.dailyLimit,
    }));
  }

  async getLimitById(
    userId: string,
    limitId: string,
  ): Promise<UserAppLimitDto> {
    const limit = await this.prisma.userAppLimit.findUnique({
      where: { id: limitId },
      include: { app: true },
    });

    if (!limit || limit.userId !== userId) {
      throw new NotFoundException('App limit not found');
    }

    return {
      id: limit.id,
      appId: limit.appId,
      packageName: limit.app.packageName,
      appName: limit.app.name,
      dailyLimit: limit.dailyLimit,
    };
  }

  async createLimit(
    userId: string,
    dto: CreateAppLimitDto,
  ): Promise<UserAppLimitDto> {
    const app = await this.prisma.app.upsert({
      where: { packageName: dto.packageName },
      update: { name: dto.name },
      create: {
        packageName: dto.packageName,
        name: dto.name,
      },
    });

    const existingLimit = await this.prisma.userAppLimit.findUnique({
      where: {
        userId_appId: {
          userId,
          appId: app.id,
        },
      },
    });

    if (existingLimit) {
      throw new ConflictException(
        'A limit for this application already exists',
      );
    }

    const created = await this.prisma.userAppLimit.create({
      data: {
        userId,
        appId: app.id,
        dailyLimit: dto.dailyLimit,
      },
      include: {
        app: true,
      },
    });

    return {
      id: created.id,
      appId: created.appId,
      packageName: created.app.packageName,
      appName: created.app.name,
      dailyLimit: created.dailyLimit,
    };
  }

  async updateLimit(
    userId: string,
    limitId: string,
    dto: UpdateAppLimitDto,
  ): Promise<UserAppLimitDto> {
    const existingLimit = await this.prisma.userAppLimit.findUnique({
      where: { id: limitId },
      include: { app: true },
    });

    if (!existingLimit || existingLimit.userId !== userId) {
      throw new NotFoundException('App limit not found');
    }

    const updated = await this.prisma.userAppLimit.update({
      where: { id: limitId },
      data: { dailyLimit: dto.dailyLimit },
      include: { app: true },
    });

    return {
      id: updated.id,
      appId: updated.appId,
      packageName: updated.app.packageName,
      appName: updated.app.name,
      dailyLimit: updated.dailyLimit,
    };
  }

  async deleteLimit(userId: string, limitId: string): Promise<void> {
    const existingLimit = await this.prisma.userAppLimit.findUnique({
      where: { id: limitId },
    });

    if (!existingLimit || existingLimit.userId !== userId) {
      throw new NotFoundException('App limit not found');
    }

    await this.prisma.userAppLimit.delete({
      where: { id: limitId },
    });
  }
}
