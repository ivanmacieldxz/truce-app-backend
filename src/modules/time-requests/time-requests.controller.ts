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
import { TimeRequestsService } from './time-requests.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { CreateTimeRequestDto } from './dto/create-time-request.dto';
import { UpdateTimeRequestDto } from './dto/update-time-request.dto';
import { QueryTimeRequestsDto } from './dto/query-time-requests.dto';
import {
  TimeRequestDetailDto,
  TimeRequestDto,
} from './dto/time-request.dto';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/time-requests')
export class TimeRequestsController {
  constructor(private readonly timeRequestsService: TimeRequestsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTimeRequest(
    @CurrentUser() user: User,
    @Body() dto: CreateTimeRequestDto,
  ): Promise<TimeRequestDto> {
    return this.timeRequestsService.createTimeRequest(user.id, dto);
  }

  @Get()
  async getTimeRequests(
    @CurrentUser() user: User,
    @Query() query: QueryTimeRequestsDto,
  ): Promise<TimeRequestDto[]> {
    return this.timeRequestsService.getTimeRequests(
      user.id,
      query.type,
      query.status,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Get(':id')
  async getTimeRequestDetail(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TimeRequestDetailDto> {
    return this.timeRequestsService.getTimeRequestDetail(user.id, id);
  }

  @Patch(':id')
  async respondTimeRequest(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTimeRequestDto,
  ): Promise<TimeRequestDto> {
    return this.timeRequestsService.respondTimeRequest(user.id, id, dto.status);
  }
}
