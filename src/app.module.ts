import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FriendshipsModule } from './modules/friendships/friendships.module';
import { TimeRequestsModule } from './modules/time-requests/time-requests.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UsageStatsModule } from './modules/usage-stats/usage-stats.module';
import { configuration } from './config/configuration';
import { envValidationSchema } from './config/env.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    PrismaModule, 
    AuthModule, 
    UsersModule, 
    FriendshipsModule, 
    TimeRequestsModule, 
    NotificationsModule, 
    UsageStatsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
