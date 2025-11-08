import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import * as webpush from 'web-push';
import { SubscribeDto} from "@/notifications/dto/notification.dto";
import { SendNotificationDto} from "@/notifications/dto/notification.dto";
import {ConfigService} from "@nestjs/config";

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(private readonly prisma: PrismaService, private readonly configService: ConfigService) {
    webpush.setVapidDetails(
      this.configService.getOrThrow('VAPID_SUBJECT'),
      this.configService.getOrThrow('VAPID_PUBLIC_KEY'),
      this.configService.getOrThrow('VAPID_PRIVATE_KEY'),
    );
  }

  /**
   * Подписка на push-уведомления
   */
  async subscribe(subscribeDto: SubscribeDto) {
    // Проверяем, существует ли уже подписка
    const existing = await this.prisma.pushSubscription.findUnique({
      where: { endpoint: subscribeDto.endpoint },
    });

    if (existing) {
      // Обновляем существующую подписку
      return this.prisma.pushSubscription.update({
        where: { endpoint: subscribeDto.endpoint },
        data: {
          p256dh: subscribeDto.keys.p256dh,
          auth: subscribeDto.keys.auth,
          userId: subscribeDto.userId,
        },
      });
    }

    // Создаём новую подписку
    return this.prisma.pushSubscription.create({
      data: {
        endpoint: subscribeDto.endpoint,
        p256dh: subscribeDto.keys.p256dh,
        auth: subscribeDto.keys.auth,
        userId: subscribeDto.userId,
      },
    });
  }

  /**
   * Отписка от push-уведомлений
   */
  async unsubscribe(endpoint: string): Promise<void> {
    await this.prisma.pushSubscription.delete({
      where: { endpoint },
    });
  }

  /**
   * Отправка уведомления всем подписчикам
   */
  async sendToAll(notification: SendNotificationDto): Promise<void> {
    const subscriptions = await this.prisma.pushSubscription.findMany();

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icon.png',
      badge: notification.badge || '/badge.png',
      data: notification.data,
    });

    const promises = subscriptions.map((sub) =>
      this.sendNotification(sub, payload),
    );

    await Promise.allSettled(promises);
  }

  /**
   * Отправка уведомления конкретному пользователю
   */
  async sendToUser(
    userId: string,
    notification: SendNotificationDto,
  ): Promise<void> {
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      this.logger.warn(`No subscriptions found for user ${userId}`);
      return;
    }

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icon.png',
      badge: notification.badge || '/badge.png',
      data: notification.data,
    });

    const promises = subscriptions.map((sub) =>
      this.sendNotification(sub, payload),
    );

    await Promise.allSettled(promises);
  }

  /**
   * Отправка уведомления на конкретную подписку
   */
  private async sendNotification(
    subscription: { id: string; endpoint: string; p256dh: string; auth: string },
    payload: string,
  ): Promise<void> {
    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };

      await webpush.sendNotification(pushSubscription, payload);
      this.logger.log(`Notification sent to ${subscription.endpoint}`);
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);

      // Если подписка невалидна (410 Gone), удаляем её
      if (error.statusCode === 410) {
        await this.prisma.pushSubscription.delete({
          where: { id: subscription.id },
        });
        this.logger.log(`Removed invalid subscription ${subscription.id}`);
      }
    }
  }

  /**
   * Получение публичного VAPID ключа
   */
  getPublicKey(): string {
    return this.configService.getOrThrow('VAPID_PUBLIC_KEY')
  }

  /**
   * Получение всех подписок
   */
  async getAllSubscriptions() {
    return this.prisma.pushSubscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            login: true,
            fullname: true,
          },
        },
      },
    });
  }

  /**
   * Получение подписок пользователя
   */
  async getUserSubscriptions(userId: string) {
    return this.prisma.pushSubscription.findMany({
      where: { userId },
    });
  }
}
