import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateTimeRequestDto } from './dto/create-time-request.dto';
import {
  TimeRequestDetailDto,
  TimeRequestDto,
} from './dto/time-request.dto';

@Injectable()
export class TimeRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private mapToDto(tr: any): TimeRequestDto {
    return {
      id: tr.id,
      senderId: tr.senderId,
      senderUsername: tr.sender.username,
      appId: tr.appId,
      appName: tr.app.name,
      packageName: tr.app.packageName,
      amountRequested: tr.amountRequested,
      message: tr.message,
      status: tr.status,
      createdAt: tr.createdAt,
      recipients: (tr.recipients || []).map((r: any) => ({
        id: r.id,
        receiverId: r.receiverId,
        receiverUsername: r.receiver?.username || '',
        status: r.status,
        createdAt: r.createdAt,
      })),
    };
  }

  async createTimeRequest(
    senderId: string,
    dto: CreateTimeRequestDto,
  ): Promise<TimeRequestDto> {
    if (dto.receiverIds.includes(senderId)) {
      throw new BadRequestException('Cannot send time request to yourself');
    }

    const app = await this.prisma.app.findUnique({
      where: { id: dto.appId },
    });

    if (!app) {
      throw new NotFoundException('App not found');
    }

    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { userId1: senderId, userId2: { in: dto.receiverIds }, user2: { deletedAt: null } },
          { userId1: { in: dto.receiverIds }, userId2: senderId, user1: { deletedAt: null } },
        ],
      },
    });

    const confirmedFriendIds = new Set(
      friendships.map((f) => (f.userId1 === senderId ? f.userId2 : f.userId1)),
    );

    const activeReceiverIds = dto.receiverIds.filter((id) => confirmedFriendIds.has(id));
    if (activeReceiverIds.length === 0) {
      throw new BadRequestException('All receivers must be confirmed friends');
    }

    const timeRequest = await this.prisma.timeRequest.create({
      data: {
        senderId,
        appId: dto.appId,
        amountRequested: dto.amountRequested,
        message: dto.message || null,
        status: 'PENDING',
        recipients: {
          create: activeReceiverIds.map((receiverId) => ({
            receiverId,
            status: 'PENDING',
          })),
        },
      },
      include: {
        sender: true,
        app: true,
        recipients: {
          include: {
            receiver: true,
          },
        },
      },
    });

    for (const recipient of timeRequest.recipients) {
      if (recipient.receiver.fcmToken) {
        await this.notificationsService.sendPushNotification(
          recipient.receiver.fcmToken,
          'Solicitud de tiempo extra',
          `@${timeRequest.sender.username} te pide ${dto.amountRequested} min para ${app.name}`,
          {
            type: 'TIME_REQUEST',
            action: 'SYNC_INBOX',
            requestId: timeRequest.id,
            senderUsername: timeRequest.sender.username,
            appName: app.name,
            amountRequested: dto.amountRequested.toString(),
          },
        );
      }
    }

    return this.mapToDto(timeRequest);
  }

  async getTimeRequests(
    userId: string,
    type?: 'INCOMING' | 'OUTGOING',
    status?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<TimeRequestDto[]> {
    const skip = (page - 1) * limit;

    let whereClause: any = {};

    if (type === 'OUTGOING') {
      whereClause.senderId = userId;
      if (status) whereClause.status = status;
    } else if (type === 'INCOMING') {
      whereClause.recipients = {
        some: {
          receiverId: userId,
          ...(status ? { status } : {}),
        },
      };
      whereClause.sender = { deletedAt: null };
    } else {
      whereClause.OR = [
        { senderId: userId },
        { recipients: { some: { receiverId: userId } }, sender: { deletedAt: null } },
      ];
      if (status) whereClause.status = status;
    }

    const requests = await this.prisma.timeRequest.findMany({
      where: whereClause,
      include: {
        sender: true,
        app: true,
        recipients: {
          include: {
            receiver: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return requests.map((r) => this.mapToDto(r));
  }

  async getTimeRequestDetail(
    userId: string,
    requestId: string,
  ): Promise<TimeRequestDetailDto> {
    const timeRequest = await this.prisma.timeRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: true,
        app: true,
        recipients: {
          include: {
            receiver: true,
          },
        },
      },
    });

    if (!timeRequest) {
      throw new NotFoundException('Time request not found');
    }

    const isSender = timeRequest.senderId === userId;
    const isRecipient = timeRequest.recipients.some(
      (r) => r.receiverId === userId,
    );

    if (!isSender && !isRecipient) {
      throw new ForbiddenException(
        'You do not have access to this time request',
      );
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const today = new Date(`${todayStr}T00:00:00.000Z`);

    const [userAppTime, userAppLimit] = await Promise.all([
      this.prisma.userAppTime.findUnique({
        where: {
          userId_appId_date: {
            userId: timeRequest.senderId,
            appId: timeRequest.appId,
            date: today,
          },
        },
      }),
      this.prisma.userAppLimit.findUnique({
        where: {
          userId_appId: {
            userId: timeRequest.senderId,
            appId: timeRequest.appId,
          },
        },
      }),
    ]);

    return {
      ...this.mapToDto(timeRequest),
      senderUsageToday: {
        timeSpent: userAppTime?.timeSpent ?? 0,
        dailyLimit: userAppLimit?.dailyLimit ?? null,
      },
    };
  }

  async respondTimeRequest(
    userId: string,
    requestId: string,
    status: 'APPROVED' | 'DENIED',
  ): Promise<TimeRequestDto> {
    const timeRequest = await this.prisma.timeRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: true,
        app: true,
        recipients: {
          include: {
            receiver: true,
          },
        },
      },
    });

    if (!timeRequest) {
      throw new NotFoundException('Time request not found');
    }

    if (timeRequest.status !== 'PENDING') {
      throw new BadRequestException('This time request is no longer pending');
    }

    const currentRecipient = timeRequest.recipients.find(
      (r) => r.receiverId === userId,
    );

    if (!currentRecipient || currentRecipient.status !== 'PENDING') {
      throw new BadRequestException(
        'You cannot respond to this time request or have already responded',
      );
    }

    if (status === 'APPROVED') {
      await this.prisma.$transaction(async (tx) => {
        await tx.timeRequestRecipient.update({
          where: { id: currentRecipient.id },
          data: { status: 'APPROVED' },
        });

        await tx.timeRequest.update({
          where: { id: requestId },
          data: { status: 'APPROVED' },
        });

        await tx.timeRequestRecipient.updateMany({
          where: {
            timeRequestId: requestId,
            receiverId: { not: userId },
            status: 'PENDING',
          },
          data: { status: 'DENIED' },
        });

        const existingLimit = await tx.userAppLimit.findUnique({
          where: {
            userId_appId: {
              userId: timeRequest.senderId,
              appId: timeRequest.appId,
            },
          },
        });

        if (existingLimit) {
          await tx.userAppLimit.update({
            where: { id: existingLimit.id },
            data: {
              dailyLimit:
                existingLimit.dailyLimit + timeRequest.amountRequested,
            },
          });
        }
      });

      if (timeRequest.sender.fcmToken) {
        await this.notificationsService.sendPushNotification(
          timeRequest.sender.fcmToken,
          '¡Tiempo extra aprobado!',
          `@${currentRecipient.receiver.username} aprobó tu solicitud de ${timeRequest.amountRequested} min para ${timeRequest.app.name}`,
          {
            type: 'TIME_REQUEST_APPROVED',
            action: 'SYNC_INBOX',
            requestId: timeRequest.id,
            amountGranted: timeRequest.amountRequested.toString(),
          },
        );
      }
    } else {
      await this.prisma.timeRequestRecipient.update({
        where: { id: currentRecipient.id },
        data: { status: 'DENIED' },
      });

      const pendingCount = await this.prisma.timeRequestRecipient.count({
        where: {
          timeRequestId: requestId,
          status: 'PENDING',
        },
      });

      if (pendingCount === 0) {
        await this.prisma.timeRequest.update({
          where: { id: requestId },
          data: { status: 'DENIED' },
        });
      }
    }

    const updated = await this.prisma.timeRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: true,
        app: true,
        recipients: {
          include: {
            receiver: true,
          },
        },
      },
    });

    return this.mapToDto(updated);
  }
}
