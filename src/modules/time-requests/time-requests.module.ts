import { Module } from '@nestjs/common';
import { TimeRequestsController } from './time-requests.controller';
import { TimeRequestsService } from './time-requests.service';

@Module({
  controllers: [TimeRequestsController],
  providers: [TimeRequestsService]
})
export class TimeRequestsModule {}
