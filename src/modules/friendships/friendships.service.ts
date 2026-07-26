import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FriendDto, FriendshipRequestDto } from './dto/friend.dto';
import { FriendshipRequestType } from './dto/query-friendships.dto';
import { FriendshipStatusUpdate } from './dto/update-friendship.dto';

@Injectable()
export class FriendshipsService {
  constructor(private prisma: PrismaService) {}

  async getFriends(userId: string, page: number, limit: number): Promise<FriendDto[]> {
    const skip = (page - 1) * limit;
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ userId1: userId }, { userId2: userId }],
      },
      include: {
        user1: { select: { id: true, username: true } },
        user2: { select: { id: true, username: true } },
      },
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });

    return friendships.map((f) => {
      const isUser1 = f.userId1 === userId;
      const friendUser = isUser1 ? f.user2 : f.user1;
      return {
        id: f.id,
        friendId: friendUser.id,
        username: friendUser.username,
        createdAt: f.createdAt,
      };
    });
  }

  async getRequests(userId: string, type: FriendshipRequestType | undefined, page: number, limit: number): Promise<FriendshipRequestDto[]> {
    const skip = (page - 1) * limit;
    
    let whereClause: any = { status: 'PENDING' };
    
    if (type === FriendshipRequestType.INCOMING) {
      whereClause.userId2 = userId;
    } else if (type === FriendshipRequestType.OUTGOING) {
      whereClause.userId1 = userId;
    } else {
      whereClause.OR = [{ userId1: userId }, { userId2: userId }];
    }

    const requests = await this.prisma.friendship.findMany({
      where: whereClause,
      include: {
        user1: { select: { id: true, username: true } },
        user2: { select: { id: true, username: true } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((req) => {
      const isOutgoing = req.userId1 === userId;
      const otherUser = isOutgoing ? req.user2 : req.user1;
      return {
        id: req.id,
        userId: otherUser.id,
        username: otherUser.username,
        type: isOutgoing ? 'OUTGOING' : 'INCOMING',
        createdAt: req.createdAt,
      };
    });
  }

  async sendRequest(senderId: string, targetUserId: string) {
    if (senderId === targetUserId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { userId1: senderId, userId2: targetUserId },
          { userId1: targetUserId, userId2: senderId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        throw new ConflictException('You are already friends');
      } else if (existing.status === 'PENDING') {
        throw new ConflictException('Friend request already exists');
      } else if (existing.status === 'REJECTED') {
        return this.prisma.friendship.update({
          where: { id: existing.id },
          data: {
            status: 'PENDING',
            userId1: senderId,
            userId2: targetUserId,
          },
        });
      }
    }

    return this.prisma.friendship.create({
      data: {
        userId1: senderId,
        userId2: targetUserId,
        status: 'PENDING',
      },
    });
  }

  async updateRequest(userId: string, friendshipId: string, status: FriendshipStatusUpdate) {
    const request = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!request) {
      throw new NotFoundException('Friendship request not found');
    }

    if (request.userId2 !== userId) {
      throw new BadRequestException('You are not authorized to update this request');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('Request is no longer pending');
    }

    return this.prisma.friendship.update({
      where: { id: friendshipId },
      data: { status },
    });
  }

  async removeFriend(userId: string, friendId: string) {
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
      throw new NotFoundException('Friend not found');
    }

    await this.prisma.friendship.delete({
      where: { id: friendship.id },
    });
  }
}
