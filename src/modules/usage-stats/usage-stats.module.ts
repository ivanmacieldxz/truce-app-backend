import { Module } from '@nestjs/common';
import { UsageStatsController } from './usage-stats.controller';
import { UsageStatsService } from './usage-stats.service';

@Module({
  controllers: [UsageStatsController],
  providers: [UsageStatsService]
})
export class UsageStatsModule {}
