import { Module } from '@nestjs/common';
import { LimitRequestsController } from './limit-requests.controller';
import { LimitRequestsService } from './limit-requests.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [LimitRequestsController],
  providers: [LimitRequestsService],
  exports: [LimitRequestsService],
})
export class LimitRequestsModule {}
