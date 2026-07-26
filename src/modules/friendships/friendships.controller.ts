import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { FriendshipsService } from './friendships.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { GetFriendsQueryDto, GetRequestsQueryDto } from './dto/query-friendships.dto';
import { CreateFriendshipDto } from './dto/create-friendship.dto';
import { UpdateFriendshipDto } from './dto/update-friendship.dto';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/friends')
export class FriendshipsController {
  constructor(private readonly friendshipsService: FriendshipsService) {}

  @Get()
  async getFriends(@CurrentUser() user: User, @Query() query: GetFriendsQueryDto) {
    return this.friendshipsService.getFriends(user.id, query.page || 1, query.limit || 20);
  }

  @Get('requests')
  async getRequests(@CurrentUser() user: User, @Query() query: GetRequestsQueryDto) {
    return this.friendshipsService.getRequests(user.id, query.type, query.page || 1, query.limit || 20);
  }

  @Post('requests')
  @HttpCode(HttpStatus.CREATED)
  async sendRequest(@CurrentUser() user: User, @Body() body: CreateFriendshipDto) {
    return this.friendshipsService.sendRequest(user.id, body.targetUserId);
  }

  @Patch('requests/:id')
  async updateRequest(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: UpdateFriendshipDto,
  ) {
    return this.friendshipsService.updateRequest(user.id, id, body.status);
  }

  @Delete(':friendId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFriend(@CurrentUser() user: User, @Param('friendId') friendId: string) {
    await this.friendshipsService.removeFriend(user.id, friendId);
  }
}
