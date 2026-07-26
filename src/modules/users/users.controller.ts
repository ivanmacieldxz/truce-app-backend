import { Controller, Get, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { UserDto, UserSummaryDto } from './dto/user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SearchUsersQueryDto } from './dto/search-users.dto';

@Controller('api/v1/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
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

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserDto> {
    const updated = await this.usersService.updateProfile(user.id, updateUserDto);
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
  async searchUsers(@Query() query: SearchUsersQueryDto): Promise<UserSummaryDto[]> {
    const users = await this.usersService.searchUsers(query.q, query.page ?? 1, query.limit ?? 20);
    return users.map((u) => ({
      id: u.id,
      username: u.username,
    }));
  }
}
