// src/push-notification/push-notification.controller.ts
import { Controller, Post, Get, Body, Delete, Query } from '@nestjs/common';
import { PushNotificationService} from "@/notifications/notification.service";
import { SubscribeDto} from "@/notifications/dto/notification.dto";
import { SendNotificationDto} from "@/notifications/dto/notification.dto";

@Controller('push-notifications')
export class PushNotificationController {
  constructor(
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  /**
   * Получение публичного VAPID ключа
   */
  @Get('public-key')
  getPublicKey() {
    return {
      publicKey: this.pushNotificationService.getPublicKey(),
    };
  }

  /**
   * Подписка на push-уведомления
   */
  @Post('subscribe')
  async subscribe(@Body() subscribeDto: SubscribeDto) {
    const subscription = await this.pushNotificationService.subscribe(
      subscribeDto,
    );
    return {
      success: true,
      message: 'Successfully subscribed to push notifications',
      subscription,
    };
  }

  /**
   * Отписка от push-уведомлений
   */
  @Delete('unsubscribe')
  async unsubscribe(@Query('endpoint') endpoint: string) {
    await this.pushNotificationService.unsubscribe(endpoint);
    return {
      success: true,
      message: 'Successfully unsubscribed from push notifications',
    };
  }

  /**
   * Отправка уведомления всем или конкретному пользователю
   */
  @Post('send')
  async sendNotification(@Body() notification: SendNotificationDto) {
    if (notification.userId) {
      await this.pushNotificationService.sendToUser(
        notification.userId,
        notification,
      );
    } else {
      await this.pushNotificationService.sendToAll(notification);
    }
    return {
      success: true,
      message: 'Notification sent',
    };
  }

  /**
   * Получение всех подписок (для отладки)
   */
  @Get('subscriptions')
  async getSubscriptions() {
    const subscriptions =
      await this.pushNotificationService.getAllSubscriptions();
    return {
      success: true,
      count: subscriptions.length,
      subscriptions,
    };
  }

  /**
   * Получение подписок пользователя
   */
  @Get('subscriptions/user/:userId')
  async getUserSubscriptions(@Query('userId') userId: string) {
    const subscriptions =
      await this.pushNotificationService.getUserSubscriptions(userId);
    return {
      success: true,
      count: subscriptions.length,
      subscriptions,
    };
  }
}
