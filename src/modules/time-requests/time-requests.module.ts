import { Module } from '@nestjs/common';
import { TimeRequestsController } from './time-requests.controller';
import { TimeRequestsService } from './time-requests.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [TimeRequestsController],
  providers: [TimeRequestsService],
  exports: [TimeRequestsService],
})
export class TimeRequestsModule {}
