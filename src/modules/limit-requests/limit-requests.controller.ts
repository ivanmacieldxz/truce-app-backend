import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { LimitRequestsService } from './limit-requests.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { CreateLimitRequestDto } from './dto/create-limit-request.dto';
import { UpdateLimitRequestDto } from './dto/update-limit-request.dto';
import { QueryLimitRequestsDto } from './dto/query-limit-requests.dto';
import {
  LimitRequestDetailDto,
  LimitRequestDto,
} from './dto/limit-request.dto';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/limit-requests')
export class LimitRequestsController {
  constructor(private readonly limitRequestsService: LimitRequestsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createLimitRequest(
    @CurrentUser() user: User,
    @Body() dto: CreateLimitRequestDto,
  ): Promise<LimitRequestDto> {
    return this.limitRequestsService.createLimitRequest(user.id, dto);
  }

  @Get()
  async getLimitRequests(
    @CurrentUser() user: User,
    @Query() query: QueryLimitRequestsDto,
  ): Promise<LimitRequestDto[]> {
    return this.limitRequestsService.getLimitRequests(
      user.id,
      query.type,
      query.status,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Get(':id')
  async getLimitRequestDetail(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<LimitRequestDetailDto> {
    return this.limitRequestsService.getLimitRequestDetail(user.id, id);
  }

  @Patch(':id')
  async respondLimitRequest(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLimitRequestDto,
  ): Promise<LimitRequestDto> {
    return this.limitRequestsService.respondLimitRequest(user.id, id, dto.status);
  }
}
