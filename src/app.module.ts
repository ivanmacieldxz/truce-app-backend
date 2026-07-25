import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FriendshipsModule } from './modules/friendships/friendships.module';
import { TimeRequestsModule } from './modules/time-requests/time-requests.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, FriendshipsModule, TimeRequestsModule, NotificationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
