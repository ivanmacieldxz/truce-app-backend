import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsageStatsService } from './usage-stats.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { SyncUsageStatsDto } from './dto/sync-usage-stats.dto';
import { QueryUsageStatsDto } from './dto/query-usage-stats.dto';
import { SyncResultDto, UserAppTimeDto } from './dto/usage-stat.dto';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/usage-stats')
export class UsageStatsController {
  constructor(private readonly usageStatsService: UsageStatsService) {}

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncStats(
    @CurrentUser() user: User,
    @Body() dto: SyncUsageStatsDto,
  ): Promise<SyncResultDto> {
    return this.usageStatsService.syncUsageStats(user.id, dto);
  }

  @Get('me')
  async getMyStats(
    @CurrentUser() user: User,
    @Query() query: QueryUsageStatsDto,
  ): Promise<UserAppTimeDto[]> {
    return this.usageStatsService.getMyUsageStats(
      user.id,
      query.date,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Get('friends/:friendId')
  async getFriendStats(
    @CurrentUser() user: User,
    @Param('friendId', ParseUUIDPipe) friendId: string,
    @Query() query: QueryUsageStatsDto,
  ): Promise<UserAppTimeDto[]> {
    return this.usageStatsService.getFriendUsageStats(
      user.id,
      friendId,
      query.date,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }
}
