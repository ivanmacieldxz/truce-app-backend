import { Module } from '@nestjs/common';
import { AppLimitsController } from './app-limits.controller';
import { AppLimitsService } from './app-limits.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AppLimitsController],
  providers: [AppLimitsService],
  exports: [AppLimitsService],
})
export class AppLimitsModule {}
