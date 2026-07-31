import { Controller, Get, Patch, Delete, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { UserDto, UserSummaryDto } from './dto/user.dto';
import { UpdateFcmTokenDto } from './dto/update-fcm-token.dto';
import { SearchUsersQueryDto } from './dto/search-users.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { ChangeUsernameDto } from './dto/change-username.dto';

@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: User): Promise<UserDto> {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      fcmToken: user.fcmToken,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
  @Patch('me/fcm-token')
  @UseGuards(JwtAuthGuard)
  async updateFcmToken(
    @CurrentUser() user: User,
    @Body() updateFcmTokenDto: UpdateFcmTokenDto,
  ): Promise<UserDto> {
    const updated = await this.usersService.updateFcmToken(user.id, updateFcmTokenDto);
    return {
      id: updated.id,
      email: updated.email,
      username: updated.username,
      fcmToken: updated.fcmToken,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
  @Get()
  @UseGuards(JwtAuthGuard)
  async searchUsers(@Query() query: SearchUsersQueryDto): Promise<UserSummaryDto[]> {
    const users = await this.usersService.searchUsers(query.q, query.page ?? 1, query.limit ?? 20);
    return users.map((u) => ({
      id: u.id,
      username: u.username,
    }));
  }

  @Get('check-username')
  async checkUsername(@Query('username') username: string) {
    if (!username) return { available: false };
    return this.usersService.checkUsername(username);
  }

  @Get('check-email')
  async checkEmail(@Query('email') email: string) {
    if (!email) return { available: false };
    return this.usersService.checkEmail(email);
  }

  @Patch('me/username')
  @UseGuards(JwtAuthGuard)
  async changeUsername(
    @CurrentUser() user: User,
    @Body() body: ChangeUsernameDto,
  ): Promise<UserDto> {
    const updated = await this.usersService.changeUsername(user.id, body.username);
    return {
      id: updated.id,
      email: updated.email,
      username: updated.username,
      fcmToken: updated.fcmToken,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  @Patch('me/email')
  @UseGuards(JwtAuthGuard)
  async changeEmail(
    @CurrentUser() user: User,
    @Body() body: ChangeEmailDto,
  ): Promise<UserDto> {
    const updated = await this.usersService.changeEmail(user.id, body.email);
    return {
      id: updated.id,
      email: updated.email,
      username: updated.username,
      fcmToken: updated.fcmToken,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@CurrentUser() user: User): Promise<void> {
    await this.usersService.deleteAccount(user.id);
  }
}
