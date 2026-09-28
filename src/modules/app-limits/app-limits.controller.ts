import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AppLimitsService } from './app-limits.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { CreateAppLimitDto } from './dto/create-app-limit.dto';
import { UpdateAppLimitDto } from './dto/update-app-limit.dto';
import { QueryAppLimitsDto } from './dto/query-app-limits.dto';
import { UserAppLimitDto } from './dto/app-limit.dto';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/app-limits')
export class AppLimitsController {
  constructor(private readonly appLimitsService: AppLimitsService) {}

  @Get()
  async getLimits(
    @CurrentUser() user: User,
    @Query() query: QueryAppLimitsDto,
  ): Promise<UserAppLimitDto[]> {
    return this.appLimitsService.getLimits(
      user.id,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Get(':id')
  async getLimitById(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserAppLimitDto> {
    return this.appLimitsService.getLimitById(user.id, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createLimit(
    @CurrentUser() user: User,
    @Body() dto: CreateAppLimitDto,
  ): Promise<UserAppLimitDto> {
    return this.appLimitsService.createLimit(user.id, dto);
  }

  @Patch(':id')
  async updateLimit(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppLimitDto,
  ): Promise<UserAppLimitDto> {
    return this.appLimitsService.updateLimit(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLimit(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.appLimitsService.deleteLimit(user.id, id);
  }
}
