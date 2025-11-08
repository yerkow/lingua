import { Module } from '@nestjs/common';
import { PushNotificationService} from "@/notifications/notification.service";
import { PushNotificationController} from "@/notifications/notification.controller";
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PushNotificationController],
  providers: [PushNotificationService],
  exports: [PushNotificationService],
})
export class PushNotificationModule {}
