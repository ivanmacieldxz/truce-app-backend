import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateLimitRequestDto } from './dto/create-limit-request.dto';
import {
  LimitRequestDetailDto,
  LimitRequestDto,
} from './dto/limit-request.dto';

@Injectable()
export class LimitRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private mapToDto(lr: any): LimitRequestDto {
    return {
      id: lr.id,
      senderId: lr.senderId,
      senderUsername: lr.sender.username,
      appId: lr.appId,
      appName: lr.app.name,
      packageName: lr.app.packageName,
      type: lr.type,
      currentLimit: lr.currentLimit,
      proposedLimit: lr.proposedLimit,
      reason: lr.reason,
      status: lr.status,
      createdAt: lr.createdAt,
      recipients: (lr.recipients || []).map((r: any) => ({
        id: r.id,
        receiverId: r.receiverId,
        receiverUsername: r.receiver?.username || '',
        status: r.status,
        createdAt: r.createdAt,
      })),
    };
  }

  async createLimitRequest(
    senderId: string,
    dto: CreateLimitRequestDto,
  ): Promise<LimitRequestDto> {
    if (dto.receiverIds.includes(senderId)) {
      throw new BadRequestException('Cannot send limit request to yourself');
    }

    const app = await this.prisma.app.findUnique({
      where: { id: dto.appId },
    });

    if (!app) {
      throw new NotFoundException('App not found');
    }

    const userLimit = await this.prisma.userAppLimit.findUnique({
      where: {
        userId_appId: {
          userId: senderId,
          appId: dto.appId,
        },
      },
    });

    if (!userLimit) {
      throw new NotFoundException(
        'You do not have a limit configured for this application',
      );
    }

    const existingPending = await this.prisma.limitRequest.findFirst({
      where: {
        senderId,
        appId: dto.appId,
        status: 'PENDING',
      },
    });

    if (existingPending) {
      throw new BadRequestException(
        'A pending limit request already exists for this app',
      );
    }

    if (dto.type === 'MODIFY') {
      if (!dto.proposedLimit || dto.proposedLimit <= 0) {
        throw new BadRequestException(
          'Proposed limit is required and must be greater than 0 for MODIFY requests',
        );
      }
      if (dto.proposedLimit === userLimit.dailyLimit) {
        throw new BadRequestException(
          'Proposed limit must be different from current daily limit',
        );
      }
    } else if (dto.type === 'DISABLE') {
      if (!userLimit.isEnabled) {
        throw new BadRequestException('Limit is already disabled');
      }
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

    const activeReceiverIds = dto.receiverIds.filter((id) =>
      confirmedFriendIds.has(id),
    );
    if (activeReceiverIds.length === 0) {
      throw new BadRequestException('All receivers must be confirmed friends');
    }

    const limitRequest = await this.prisma.limitRequest.create({
      data: {
        senderId,
        appId: dto.appId,
        type: dto.type,
        currentLimit: userLimit.dailyLimit,
        proposedLimit: dto.type === 'MODIFY' ? dto.proposedLimit : null,
        reason: dto.reason || null,
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

    const actionTextMap: Record<string, string> = {
      MODIFY: `modificar su límite a ${dto.proposedLimit} min`,
      DISABLE: 'desactivar su límite',
      DELETE: 'eliminar su límite',
    };

    const actionText = actionTextMap[dto.type] || 'gestionar su límite';

    for (const recipient of limitRequest.recipients) {
      if (recipient.receiver.fcmToken) {
        await this.notificationsService.sendPushNotification(
          recipient.receiver.fcmToken,
          'Solicitud de límite',
          `@${limitRequest.sender.username} te pide ${actionText} para ${app.name}`,
          {
            type: 'LIMIT_REQUEST',
            action: 'SYNC_INBOX',
            requestId: limitRequest.id,
            requestType: dto.type,
            senderUsername: limitRequest.sender.username,
            appName: app.name,
          },
        );
      }
    }

    return this.mapToDto(limitRequest);
  }

  async getLimitRequests(
    userId: string,
    type?: 'INCOMING' | 'OUTGOING',
    status?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<LimitRequestDto[]> {
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

    const requests = await this.prisma.limitRequest.findMany({
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

  async getLimitRequestDetail(
    userId: string,
    requestId: string,
  ): Promise<LimitRequestDetailDto> {
    const limitRequest = await this.prisma.limitRequest.findUnique({
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

    if (!limitRequest) {
      throw new NotFoundException('Limit request not found');
    }

    const isSender = limitRequest.senderId === userId;
    const isRecipient = limitRequest.recipients.some(
      (r) => r.receiverId === userId,
    );

    if (!isSender && !isRecipient) {
      throw new ForbiddenException(
        'You do not have access to this limit request',
      );
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const today = new Date(`${todayStr}T00:00:00.000Z`);

    const [userAppTime, userAppLimit] = await Promise.all([
      this.prisma.userAppTime.findUnique({
        where: {
          userId_appId_date: {
            userId: limitRequest.senderId,
            appId: limitRequest.appId,
            date: today,
          },
        },
      }),
      this.prisma.userAppLimit.findUnique({
        where: {
          userId_appId: {
            userId: limitRequest.senderId,
            appId: limitRequest.appId,
          },
        },
      }),
    ]);

    return {
      ...this.mapToDto(limitRequest),
      senderUsageToday: {
        timeSpent: userAppTime?.timeSpent ?? 0,
        dailyLimit: userAppLimit?.dailyLimit ?? null,
        isEnabled: userAppLimit?.isEnabled ?? false,
      },
    };
  }

  async respondLimitRequest(
    userId: string,
    requestId: string,
    status: 'APPROVED' | 'REJECTED',
  ): Promise<LimitRequestDto> {
    const limitRequest = await this.prisma.limitRequest.findUnique({
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

    if (!limitRequest) {
      throw new NotFoundException('Limit request not found');
    }

    if (limitRequest.status !== 'PENDING') {
      throw new BadRequestException('This limit request is no longer pending');
    }

    const currentRecipient = limitRequest.recipients.find(
      (r) => r.receiverId === userId,
    );

    if (!currentRecipient || currentRecipient.status !== 'PENDING') {
      throw new BadRequestException(
        'You cannot respond to this limit request or have already responded',
      );
    }

    if (status === 'APPROVED') {
      await this.prisma.$transaction(async (tx) => {
        await tx.limitRequestRecipient.update({
          where: { id: currentRecipient.id },
          data: { status: 'APPROVED' },
        });

        await tx.limitRequest.update({
          where: { id: requestId },
          data: { status: 'APPROVED' },
        });

        await tx.limitRequestRecipient.updateMany({
          where: {
            limitRequestId: requestId,
            receiverId: { not: userId },
            status: 'PENDING',
          },
          data: { status: 'REJECTED' },
        });

        if (limitRequest.type === 'MODIFY') {
          await tx.userAppLimit.update({
            where: {
              userId_appId: {
                userId: limitRequest.senderId,
                appId: limitRequest.appId,
              },
            },
            data: {
              dailyLimit: limitRequest.proposedLimit!,
            },
          });
        } else if (limitRequest.type === 'DISABLE') {
          await tx.userAppLimit.update({
            where: {
              userId_appId: {
                userId: limitRequest.senderId,
                appId: limitRequest.appId,
              },
            },
            data: {
              isEnabled: false,
            },
          });
        } else if (limitRequest.type === 'DELETE') {
          await tx.userAppLimit.delete({
            where: {
              userId_appId: {
                userId: limitRequest.senderId,
                appId: limitRequest.appId,
              },
            },
          });
        }
      });

      if (limitRequest.sender.fcmToken) {
        const approvedActionLabels: Record<string, string> = {
          MODIFY: `modificación (${limitRequest.proposedLimit} min)`,
          DISABLE: 'desactivación',
          DELETE: 'eliminación',
        };

        const label =
          approvedActionLabels[limitRequest.type] || 'solicitud de límite';

        await this.notificationsService.sendPushNotification(
          limitRequest.sender.fcmToken,
          '¡Solicitud de límite aprobada!',
          `@${currentRecipient.receiver.username} aprobó tu solicitud de ${label} para ${limitRequest.app.name}`,
          {
            type: 'LIMIT_REQUEST_RESOLVED',
            action: 'SYNC_INBOX',
            requestId: limitRequest.id,
            requestType: limitRequest.type,
            status: 'APPROVED',
          },
        );
      }
    } else {
      await this.prisma.limitRequestRecipient.update({
        where: { id: currentRecipient.id },
        data: { status: 'REJECTED' },
      });

      const pendingCount = await this.prisma.limitRequestRecipient.count({
        where: {
          limitRequestId: requestId,
          status: 'PENDING',
        },
      });

      if (pendingCount === 0) {
        await this.prisma.limitRequest.update({
          where: { id: requestId },
          data: { status: 'REJECTED' },
        });

        if (limitRequest.sender.fcmToken) {
          await this.notificationsService.sendPushNotification(
            limitRequest.sender.fcmToken,
            'Solicitud de límite rechazada',
            `Tu solicitud para ${limitRequest.app.name} fue rechazada`,
            {
              type: 'LIMIT_REQUEST_RESOLVED',
              action: 'SYNC_INBOX',
              requestId: limitRequest.id,
              requestType: limitRequest.type,
              status: 'REJECTED',
            },
          );
        }
      }
    }

    const updated = await this.prisma.limitRequest.findUnique({
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
