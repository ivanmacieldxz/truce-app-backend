import { Module } from '@nestjs/common';
import { UsageStatsController } from './usage-stats.controller';
import { UsageStatsService } from './usage-stats.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UsageStatsController],
  providers: [UsageStatsService],
  exports: [UsageStatsService],
})
export class UsageStatsModule {}
