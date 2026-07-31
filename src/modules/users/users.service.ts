import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { User, Prisma } from '@prisma/client';
import { UpdateFcmTokenDto } from './dto/update-fcm-token.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async updateFcmToken(userId: string, data: UpdateFcmTokenDto): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async searchUsers(query: string, page: number, limit: number): Promise<User[]> {
    const skip = (page - 1) * limit;

    return this.prisma.user.findMany({
      where: {
        username: {
          contains: query,
          mode: 'insensitive',
        },
      },
      skip,
      take: limit,
      orderBy: {
        username: 'asc',
      },
    });
  }

  async checkUsername(username: string): Promise<{ available: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });
    return { available: !user };
  }

  async checkEmail(email: string): Promise<{ available: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return { available: !user };
  }

  async changeUsername(userId: string, newUsername: string): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { username: newUsername },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Username already in use');
      }
      throw error;
    }
  }

  async changeEmail(userId: string, newEmail: string): Promise<User> {
    // 1. Update in Supabase Auth first. If this fails, we don't touch Prisma.
    const { error: authError } = await this.supabaseService.client.auth.admin.updateUserById(userId, {
      email: newEmail,
    });

    if (authError) {
      if (authError.message.toLowerCase().includes('already registered')) {
         throw new ConflictException('Email already in use in auth provider');
      }
      throw new InternalServerErrorException('Failed to update email in auth provider');
    }

    // 2. Update in Prisma
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { email: newEmail },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email already in use');
      }
      throw error;
    }
  }

  async deleteAccount(userId: string): Promise<void> {
    // 1. Delete from Prisma
    try {
      await this.prisma.user.delete({
        where: { id: userId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }

    // 2. Delete from Supabase Auth
    const { error: authError } = await this.supabaseService.client.auth.admin.deleteUser(userId);
    if (authError) {
      // We log this because the Prisma deletion succeeded, but auth deletion failed.
      console.error(`Failed to delete user ${userId} from Supabase Auth:`, authError);
      throw new InternalServerErrorException('Account partially deleted. Failed to remove from auth provider.');
    }
  }
}
